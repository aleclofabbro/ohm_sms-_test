import { generateRecursiveArrayMap } from './generateRecursiveArrayMap' // La tua funzione precedente
import grammar from '../assets/grammar.ohm-bundle'
import type { AnyObject } from 'mingo/types'
import { inspect } from 'util'

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
    const targetInfo = targetNode.eval(this.args.currentPath)
    const entityName = targetInfo.name
    const targetIds = idsStringInt(targetInfo.ids)

    // Costruiamo il path per i figli (es: ['Order'])
    const childPath = [entityName]

    // Valutiamo tutte le istruzioni sottostanti e uniamo gli oggetti ritornati
    const stmts = statementsNode.children.map((c) => c.eval(childPath))
    const mutations = Object.assign({}, ...stmts)

    // Costruiamo la leafExpression (il caso foglia per il $set)
    const leafExpression = {
      $cond: {
        if: { $in: ['$$CURRENT_ITEM.id', targetIds] },
        then: mutations,
        else: {},
      },
    }

    // Chiamiamo la tua utility ricorsiva
    return generateRecursiveArrayMap({
      currentPath: [],
      nextPathSegment: [entityName],
      leafExpression,
    })
  },

  NestedBlock(targetNode, statementsNode, _up) {
    const targetInfo = targetNode.eval(this.args.currentPath)
    const subArrayName = targetInfo.name
    const targetIds = idsStringInt(targetInfo.ids)
    // Aggiungiamo il segmento corrente al path ricorsivo
    const childPath = [...this.args.currentPath, subArrayName]

    const stmts = statementsNode.children.map((c) => c.eval(childPath))
    const mutations = Object.assign({}, ...stmts)

    const leafExpression = {
      $cond: {
        if: { $in: ['$$CURRENT_ITEM.id', targetIds] },
        then: mutations,
        else: {},
      },
    }

    // Ricorsione per il sotto-blocco
    return generateRecursiveArrayMap({
      currentPath: this.args.currentPath, // Path fin qui (es. ['Order'])
      nextPathSegment: [subArrayName], // Segmento target (es. ['items'])
      leafExpression,
    })
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
  Statement_AddSetOp(op) {
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

  AddSetOp(_addset, ident, jsonMock) {
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
//   console.log(inspect(pipeline,{depth: 20 , }))
  return pipeline
}
