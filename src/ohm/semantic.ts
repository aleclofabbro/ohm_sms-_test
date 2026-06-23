/* eslint-disable preserve-caught-error */
/* eslint-disable @typescript-eslint/no-unused-vars */
import grammar from './grammar/grammar.ohm-bundle.js'
// Puoi usare 'get' di radashi se preferisci semplificare, ma per validare 
// l'albero dei tipi del descriptor (che ha 'properties' ed 'items')
// una funzione dedicata è più sicura.
import type {
  ModelDescriptor,
  CompileQueryResult,
  CompileQueryBlock,
  SelectCommand,
  ValueMutationCommand,
  RemoveCommand,
  Command,
  EntityIds,
  _any
} from './types.js'

export function compileQuery(
  query: string,
  modelDescriptor: ModelDescriptor
): CompileQueryResult {
  
  const matchResult = grammar.match(query)
  if (matchResult.failed()) {
    throw new Error(`Syntax Error:\n${matchResult.message}`)
  }

  // =========================================================
  // HELPER: Validazione profonda sul ModelDescriptor
  // =========================================================
  function validateDescriptorPath(absolutePath: string) {
    const parts = absolutePath.split('.')
    const root = parts[0]
    
    if (!modelDescriptor[root]) {
      throw new Error(`Semantic Error: L'entità root '${root}' non esiste nel ModelDescriptor.`)
    }
    
    // Navighiamo il descriptor per validare la dot-notation e i nested array
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let currentDesc: any = modelDescriptor[root]
    
    for (let i = 1; i < parts.length; i++) {
      const prop = parts[i]
      
      if (currentDesc.type === 'object' && currentDesc.properties) {
        currentDesc = currentDesc.properties[prop]
      } else if (currentDesc.type === 'array' && currentDesc.items) {
        if (currentDesc.items.type === 'object') {
          currentDesc = currentDesc.items.properties[prop]
        } else {
          debug()
          throw new Error(
            `Semantic Error: Impossibile navigare '${prop}', l'array '${parts[i - 1]}' contiene primitive.`,
          )
        }
      } else {
        debug()
        throw new Error(
          `Semantic Error: Impossibile navigare '${prop}' da '${parts[i - 1]}'.`,
        )
      }
      
      if (!currentDesc) {
        throw new Error(`Semantic Error: La proprietà '${prop}' nel path '${absolutePath}' non esiste nel descrittore.`)
      }
      function debug() {
        console.log({ prop, currentDesc })
      }
    }
  }

  const semantics = grammar.createSemantics()
  
  // =========================================================
  // STATE MANAGEMENT: Stack dei path per supportare l'annidamento
  // =========================================================
  const pathStack: string[] = []

  semantics.addOperation('toAST()', {
    Program(statementSeq) {
      const nodes = statementSeq.toAST() as unknown[]
      // Estraiamo solo i blocchi root (livello 0)
      const blocks = nodes
        .flat()
        .filter((node: _any) => node && node.select) as CompileQueryBlock[]

      return { queries: blocks } satisfies CompileQueryResult
    },

    StatementSequence(statements) {
      return statements.children.map((child) => child.toAST())
    },

    Statement(stmt) {
      return stmt.toAST()
    },

    SelectBlock(
      _kwSelect,
      propPath,
      _lParen,
      idList,
      _rParen,
      _eol,
      stmtSeq,
      _kwDone,
      _eol2,
    ) {
      const localTarget = propPath.sourceString

      // Costruiamo il path assoluto guardando il padre nello stack
      const parentPath =
        pathStack.length > 0 ? pathStack[pathStack.length - 1] : ''
      const absoluteTarget = parentPath
        ? `${parentPath}.${localTarget}`
        : localTarget

      // Validazione contestuale (Aware)
      validateDescriptorPath(absoluteTarget)

      // "Push" del contesto corrente prima di valutare i figli
      pathStack.push(absoluteTarget)

      const commands = stmtSeq.toAST().flat().filter(Boolean) as Command[]

      // "Pop" in risalita
      pathStack.pop()

      const select: SelectCommand = {
        type: 'SELECT',
        target: absoluteTarget, // Es: diventerà "organizations.departments"
        targetIds: idList.toAST() as EntityIds,
        sourceString: this.sourceString,
      }

      // Ritorniamo il blocco. Se questo SELECT è annidato, finirà dentro
      // l'array `commands` del parent SelectBlock.
      return {
        type: 'CompileQueryBlock',
        query: this.sourceString,
        select,
        commands,
      } satisfies CompileQueryBlock
    },

    // --- Istruzioni di Mutazione ---

    SetStmt(_kw, propPath, _eq, jsonVal) {
      return {
        type: 'SET',
        path: propPath.sourceString, // Il path per radashi resta relativo al target del blocco
        value: jsonVal.toAST(),
        sourceString: this.sourceString,
      } satisfies ValueMutationCommand
    },

    AddStmt(_kw, propPath, _eq, jsonVal) {
      return {
        type: 'ADD',
        path: propPath.sourceString,
        value: jsonVal.toAST(),
        sourceString: this.sourceString,
      } satisfies ValueMutationCommand
    },

    UpsertStmt(_kw, propPath, _eq, jsonVal) {
      return {
        type: 'UPSERT',
        path: propPath.sourceString,
        value: jsonVal.toAST(),
        sourceString: this.sourceString,
      } satisfies ValueMutationCommand
    },

    RemoveStmt(_kw, propPath, _lParen, idList, _rParen, _eol) {
      return {
        type: 'REMOVE',
        path: propPath.sourceString,
        targetIds: idList.toAST() as EntityIds,
        sourceString: this.sourceString,
      } satisfies RemoveCommand
    },

    // --- Regole Lessicali ---

    IdList(ids) {
      return ids.asIteration().children.map((c) => c.toAST())
    },

    Id(val) {
      return val.toAST()
    },

    StringId(_lQuote, chars, _rQuote) {
      return chars.sourceString
    },

    IntId(_sign, _digits) {
      return parseInt(this.sourceString, 10)
    },

    jsonValue(_chars) {
      const raw = this.sourceString.replace(/\/\/.*$/, '').trim()
      try {
        return JSON.parse(raw)
      } catch (error) {
        throw new Error(
          `JSON Parse Error nella query:\n'${raw}'\nDettaglio: ${(error as Error).message}`,
        )
      }
    },

    nl(_cr, _lf) {
      return null
    },
  })

  return semantics(matchResult).toAST() as CompileQueryResult
}