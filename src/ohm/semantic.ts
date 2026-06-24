/* eslint-disable preserve-caught-error */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { last, sift } from 'radashi'
import grammar from './grammar/grammar.ohm-bundle.js'
// Puoi usare 'get' di radashi se preferisci semplificare, ma per validare 
// l'albero dei tipi del descriptor (che ha 'properties' ed 'items')
// una funzione dedicata è più sicura.
import {
  isPrimitiveDescriptor,
  type _any,
  type ArrayDescriptor,
  type Command,
  type CompileQueryResult,
  type EntityCollectionDescriptor,
  type Ids,
  type ModelDescriptor,
  type RemoveCommand,
  type SelectBlock,
  type SelectCommand,
  type SomeDescriptor,
  type SetCommand,
  type UpsertCommand,
  type AddCommand,
  type IdProp,
} from './types'
type RootStackItem = {
  descriptor: ModelDescriptor
}

type EntityStackItem = {
  entityName: string
  descriptor: EntityCollectionDescriptor
}

type ArrayStackItem = {
  dotPathSegment: string
  descriptor: ArrayDescriptor
}
type StackItemDescriptor = StackItem['descriptor']
type Stack = [RootStackItem, EntityStackItem?, ...ArrayStackItem[]]
type StackItem = RootStackItem | EntityStackItem | ArrayStackItem
  
export function compileQuery(
  query: string,
  modelDescriptor: ModelDescriptor,
): CompileQueryResult {
  const matchResult = grammar.match(query)
  if (matchResult.failed()) {
    throw new Error(`Syntax Error:\n${matchResult.message}`)
  }

  // // =========================================================
  // // HELPER: Validazione profonda sul ModelDescriptor
  // // =========================================================
  // function validateDescriptorPath(absolutePath: string) {
  //   const parts = absolutePath.split('.')
  //   const root = parts[0]

  //   if (!modelDescriptor[root]) {
  //     throw new Error(
  //       `Semantic Error: L'entità root '${root}' non esiste nel ModelDescriptor.`,
  //     )
  //   }

  //   // Navighiamo il descriptor per validare la dot-notation e i nested array
  //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //   let currentDesc: any = modelDescriptor[root]

  //   for (let i = 1; i < parts.length; i++) {
  //     const prop = parts[i]

  //     if (currentDesc.type === 'object' && currentDesc.properties) {
  //       currentDesc = currentDesc.properties[prop]
  //     } else if (currentDesc.type === 'array' && currentDesc.items) {
  //       if (currentDesc.items.type === 'object') {
  //         currentDesc = currentDesc.items.properties[prop]
  //       } else {
  //         debug()
  //         throw new Error(
  //           `Semantic Error: Impossibile navigare '${prop}', l'array '${parts[i - 1]}' contiene primitive.`,
  //         )
  //       }
  //     } else {
  //       debug()
  //       throw new Error(
  //         `Semantic Error: Impossibile navigare '${prop}' da '${parts[i - 1]}'.`,
  //       )
  //     }

  //     if (!currentDesc) {
  //       throw new Error(
  //         `Semantic Error: La proprietà '${prop}' nel path '${absolutePath}' non esiste nel descrittore.`,
  //       )
  //     }
  //     function debug() {
  //       console.log({ prop, currentDesc })
  //     }
  //   }
  // }

  const semantics = grammar.createSemantics()

  const rootStackItem: RootStackItem = { descriptor: modelDescriptor }
  const stack: Stack = [rootStackItem]

  semantics.addOperation('toAST()', {
    Program(statementSeq) {
      const nodes = statementSeq.toAST() as (SelectBlock | null | undefined)[]
      const selectBlocks = sift(nodes)
      return { selectBlocks } satisfies CompileQueryResult
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
console.log(stack)
pushStack(localTarget)
console.log(stack)
const commands = sift(stmtSeq.toAST() as (Command | null | undefined)[])

      const select: SelectCommand = {
        type: 'SELECT',
        path: localTarget,
        targetIds: idList.toAST() as Ids,
        sourceString: this.sourceString,
        idProp: idProp(),
        isList: true,
        isTargetedList: true,
      }

      popStack()

      return {
        type: 'SelectBlock',
        query: this.sourceString,
        select,
        commands,
      } satisfies SelectBlock
    },


    SetStmt(_kw, propPath, _eq, jsonVal) {
      const localTarget = propPath.sourceString
      return {
        type: 'SET',
        path: localTarget, // Il path per radashi resta relativo al target del blocco
        value: jsonVal.toAST(),
        sourceString: this.sourceString,
        isList: false,
        isTargetedList: false,
      } satisfies SetCommand
    },

    AddStmt(_kw, propPath, _eq, jsonVal) {
      return {
        type: 'ADD',
        path: propPath.sourceString,
        value: jsonVal.toAST(),
        sourceString: this.sourceString,
        isList: true,
        isTargetedList: false,
      } satisfies AddCommand
    },

    UpsertStmt(_kw, propPath, _eq, jsonVal) {
      return {
        type: 'UPSERT',
        path: propPath.sourceString,
        value: jsonVal.toAST(),
        sourceString: this.sourceString,
        isList: true,
        isTargetedList: false,
      } satisfies UpsertCommand
    },

    RemoveStmt(_kw, propPath, _lParen, idList, _rParen, _eol) {
      return {
        type: 'REMOVE',
        path: propPath.sourceString,
        sourceString: this.sourceString,
        isList: true,
        targetIds: idList.toAST() as Ids,
        idProp: idProp(),
        isTargetedList: true,
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

  function idProp(): IdProp | undefined {
    const currentStack = stack_current()
    return currentStack.descriptor.type === 'array'
      ? currentStack.descriptor.items.type === 'object'
        ? currentStack.descriptor.items.idProp
        : undefined
      : undefined
  }
  function stack_current() {
    return last(stack)!
  }

  function getTargetDescriptor(
    descriptor: SomeDescriptor,
    dotPath: string,
  ): SomeDescriptor {
    const [prop, ...restPath] = dotPath.split('.')
    if (!prop) {
      return descriptor
    }
    if (prop && isPrimitiveDescriptor(descriptor)) {
      throw new Error(`cannot getDescriptor ${dotPath} in ${descriptor.type}`, {
        cause: { current: descriptor, dotPath },
      })
    }

    const restDotPath = restPath.join('.')
    const nextDesc = isPrimitiveDescriptor(descriptor)
      ? descriptor
      : descriptor.type === 'object' || descriptor.type === 'model'
        ? getTargetDescriptor(descriptor.properties[prop], restDotPath)
        : descriptor.type === 'array'
          ? getTargetDescriptor(descriptor.items, restDotPath)
          : (null as never)
    return nextDesc
  }
  function pushStack(dotPath: string) {
    const inDescriptor = stack_current().descriptor
    const selectionContextDescriptor = selectPath(inDescriptor, dotPath)
    const newStackItem: StackItem = {
      descriptor: selectionContextDescriptor,
      dotPathSegment: dotPath,
    }
    stack.push(newStackItem)
    return newStackItem
  }
  function popStack() {
    if (stack.length < 2) {
      throw new Error(`cannot popStack with stack length ${stack.length}`, {
        cause: { stack },
      })
    }
    const prevStackItem = stack.pop()
    return prevStackItem!
  }
  function selectPath(
    inDescriptor: StackItemDescriptor,
    dotPath: string,
  ): EntityCollectionDescriptor | ArrayDescriptor {
    const targetDescriptor = getTargetDescriptor(inDescriptor, dotPath)
    console.log({ inDescriptor, dotPath, targetDescriptor })
    if (targetDescriptor.type !== 'array') {
      throw new Error(
        `cannot selectionStack ${dotPath} in ${inDescriptor.type}: found ${targetDescriptor.type}`,
        {
          cause: { descriptor: inDescriptor, dotPath, targetDescriptor },
        },
      )
    }

    return targetDescriptor
  }
}