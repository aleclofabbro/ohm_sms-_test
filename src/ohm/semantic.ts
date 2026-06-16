import { generateRecursiveArrayMap } from './generateRecursiveArrayMap' // La tua funzione precedente
import grammar from '../assets/grammar.ohm-bundle'
import type { AnyObject } from 'mingo/types'

// 1. Inizializzazione della grammatica (stringa fornita nel tuo file grammar.ohm)

// 2. Creazione della Semantica
const semantics = grammar.createSemantics()

/**
 * Operazione 'eval(currentPath)':
 * Esegue il parsing ricorsivo scendendo nell'albero della query.
 * currentPath: Tiene traccia del path ricorsivo corrente per comporre correttamente
 * i PipelineGeneratorArgs della tua funzione custom.
 */
semantics.addOperation('eval(currentPath)', {
  Query(targetNode, statementsNode) {
    const targetInfo = targetNode.eval(this.args.currentPath);
    const entityName = targetInfo.name;
    const targetIds = idsStringInt(targetInfo.ids)
    const childPath = [entityName];

    const stmts = statementsNode.children.map(c => c.eval(childPath));
    
    // 1. Concatena le operazioni che agiscono sulla stessa chiave
    const chainedMutations = chainMutations(stmts);
    
    // 2. Espande la dot-notation in $mergeObjects
    const expandedMutations = expandDotNotation(chainedMutations, "$$CURRENT_ITEM");

    const leafExpression = {
      $cond: {
        if: { $in: ["$$CURRENT_ITEM.id", targetIds] },
        then: expandedMutations,
        else: {}
      }
    };

    return generateRecursiveArrayMap({
      currentPath: [],
      nextPathSegment: [entityName],
      leafExpression
    });
  },

  NestedBlock(targetNode, statementsNode, _up) {
    const targetInfo = targetNode.eval(this.args.currentPath);
    const subArrayName = targetInfo.name;
    const targetIds = idsStringInt(targetInfo.ids)
    const childPath = [...this.args.currentPath, subArrayName];

    const stmts = statementsNode.children.map(c => c.eval(childPath));
    
    // Stessa logica di risoluzione per i blocchi annidati
    const chainedMutations = chainMutations(stmts);
    const expandedMutations = expandDotNotation(chainedMutations, "$$CURRENT_ITEM");

    const leafExpression = {
      $cond: {
        if: { $in: ["$$CURRENT_ITEM.id", targetIds] },
        then: expandedMutations,
        else: {}
      }
    };

    return generateRecursiveArrayMap({
      currentPath: this.args.currentPath,
      nextPathSegment: [subArrayName],
      leafExpression
    });
  },
  Target(_on, ident, _lparen, ids, _rparen) {
    return {
      name: ident.sourceString,
      ids: ids.asIteration().children.map((c) => c.sourceString.trim()),
    }
  },

  // Switch per l'interfaccia Statement
  Statement_SetOp(op) {
    return op.eval(this.args.currentPath)
  },
  Statement_AddOp(op) {
    return op.eval(this.args.currentPath)
  },
  Statement_UpsertOp(op) {
    return op.eval(this.args.currentPath)
  },
  Statement_RemoveOp(op) {
    return op.eval(this.args.currentPath)
  },
  Statement_NestedBlock(op) {
    return op.eval(this.args.currentPath)
  },

  // --- Implementazione delle Mutazioni MongoDB ---

  SetOp(_set, path, _colon, jsonMock) {
    const key = path.sourceString
    const valueStr = jsonMock.sourceString.trim()
    return { [key]: JSON.parse(valueStr) }
  },

  AddOp(_add, ident, jsonMock) {
      console.log('***********\n',[ident, jsonMock].map(_=>_.sourceString))
    const key = ident.sourceString
    const newItems = JSON.parse(jsonMock.sourceString.trim())
    return {
      [key]: {
        $concatArrays: [{ $ifNull: [`$$CURRENT_ITEM.${key}`, []] }, newItems],
      },
    }
  },

  UpsertOp(_upsert, ident, jsonMock) {
    const key = ident.sourceString
    const newItems = JSON.parse(jsonMock.sourceString.trim())

    // Upsert intelligente in array tramite pipeline:
    // Filtriamo gli elementi esistenti che NON corrispondono agli ID dei nuovi elementi,
    // e poi concateniamo i nuovi elementi.
    return {
      [key]: {
        $let: {
          vars: { newElements: newItems },
          in: {
            $concatArrays: [
              {
                $filter: {
                  input: { $ifNull: [`$$CURRENT_ITEM.${key}`, []] },
                  as: 'existing',
                  cond: {
                    $not: {
                      $in: [
                        '$$existing.id',
                        {
                          $map: {
                            input: '$$newElements',
                            as: 'ni',
                            in: '$$ni.id',
                          },
                        },
                      ],
                    },
                  },
                },
              },
              '$$newElements',
            ],
          },
        },
      },
    }
  },

  RemoveOp(_remove, ident, _lparen, ids, _rparen) {
    const key = ident.sourceString
    const idList = ids.asIteration().children.map((c) => c.sourceString.trim())

    return {
      [key]: {
        $filter: {
          input: { $ifNull: [`$$CURRENT_ITEM.${key}`, []] },
          as: 'el',
          cond: {
            $not: { $in: ['$$el.id', idList] },
          },
        },
      },
    }
  },
})

function idsStringInt(ids: string[]) {
  const intTargetIds = ids.map((_) => parseInt(_))
  const stringTargetIds = ids.map(String)
  const targetIds = [...stringTargetIds, ...intTargetIds]
  return targetIds
}

/**
 * 3. Funzione di Wrappaggio Principale
 * Prende in ingresso la query testuale e il modello dati.
 */
export function compileQueryToPipeline(query: string): AnyObject[] {
  const match = grammar.match(query)

  if (match.failed()) {
    throw new Error(`Syntax Error in Query:\\n${match.message}`)
  }

  // --- Validazione opzionale tramite Model ---
  // Estraiamo il primo token utile per sapere quale entità root viene attaccata.
  // Nel nostro caso la root query inizia sempre con "ON EntityName(...)"
  //   const rootMatch = query.match(/^ON\s+([A-Za-z_][A-Za-z0-9_]*)/);
  //   if (rootMatch && model && model.length > 0) {
  //     const rootEntityName = rootMatch[1];
  //     if (!model[0].hasOwnProperty(rootEntityName)) {
  //        throw new Error(`Model Validation Error: Entity '${rootEntityName}' non trovata nel modello sorgente.`);
  //     }
  //   }

  // Eseguiamo la valutazione dell'AST passando come currentPath iniziale un array vuoto
  const setExpression = semantics(match).eval([])

  const pipeline = [{ $set: setExpression }]
  // Ritorna la pipeline pronta per essere passata a MongoDB
  // console.log(inspect(pipeline,{depth: 20 , }))
  return pipeline
}
/**
 * Converte un oggetto piatto con chiavi in dot-notation in un albero di $mergeObjects.
 * Es: { "customer.type": "premium" } => { customer: { $mergeObjects: [...] } }
 */
function expandDotNotation(flatMutations: Record<string, any>, basePath: string = "$$CURRENT_ITEM"): Record<string, any> {
  const expanded: Record<string, any> = {};
  const nestedGroups: Record<string, Record<string, any>> = {};

  // 1. Separiamo le chiavi piatte da quelle annidate
  for (const [key, value] of Object.entries(flatMutations)) {
    if (key.includes('.')) {
      const [first, ...rest] = key.split('.');
      if (!nestedGroups[first]) nestedGroups[first] = {};
      nestedGroups[first][rest.join('.')] = value;
    } else {
      expanded[key] = value;
    }
  }

  // 2. Risolviamo ricorsivamente i gruppi annidati usando $mergeObjects
  for (const [first, nestedMutations] of Object.entries(nestedGroups)) {
    const currentPropPath = `${basePath}.${first}`;
    const resolvedNested = expandDotNotation(nestedMutations, currentPropPath);
    
    expanded[first] = {
      $mergeObjects: [
        { $ifNull: [`${basePath}.${first}`, {}] },
        resolvedNested
      ]
    };
  }

  return expanded;
}
/**
 * Risolve le collisioni di istruzioni multiple sulla stessa chiave.
 * Invece di sovrascrivere, concatena le operazioni passando l'output 
 * della precedente come input della successiva tramite $let.
 */
function chainMutations(stmts: Record<string, any>[]): Record<string, any> {
  const result: Record<string, any> = {};

  for (const stmt of stmts) {
    for (const [key, expr] of Object.entries(stmt)) {
      if (result[key] !== undefined) {
        // COLLISIONE RILEVATA! (es. REMOVE logs seguito da ADD logs)
        const previousExpr = result[key];
        
        result[key] = {
          $let: {
            vars: { PREV_VAL: previousExpr },
            // Sostituiamo il riferimento alla risorsa originale con il risultato step precedente
            in: deepReplace(expr, `$$CURRENT_ITEM.${key}`, "$$PREV_VAL")
          }
        };
      } else {
        result[key] = expr;
      }
    }
  }
  return result;
}

/**
 * Naviga l'AST ricorsivamente per sostituire una stringa specifica.
 */
function deepReplace(obj: any, search: string, replacement: string): any {
  if (typeof obj === 'string') {
    return obj === search ? replacement : obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => deepReplace(item, search, replacement));
  }
  if (obj !== null && typeof obj === 'object') {
    const newObj: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      newObj[k] = deepReplace(v, search, replacement);
    }
    return newObj;
  }
  return obj;
}