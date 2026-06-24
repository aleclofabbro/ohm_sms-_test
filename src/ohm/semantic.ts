/* eslint-disable preserve-caught-error */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { last, sift } from 'radashi'
import grammar from './grammar/grammar.ohm-bundle.js'
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
  idExtractor,
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

  const semantics = grammar.createSemantics()

  const rootStackItem: RootStackItem = { descriptor: modelDescriptor }
  const stack: Stack = [rootStackItem]

  semantics.addOperation('toAST()', {
    _iter(...children) {
      return children.map((child) => child.toAST())
    },

    Program(selectBlockSequence) {
      const selectBlocks = sift(
        selectBlockSequence.toAST() as (SelectBlock | null | undefined)[],
      )
      return { selectBlocks } satisfies CompileQueryResult
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
      // console.log(inspect([...stack], { colors: true, depth: 5 }))
      pushStack(localTarget)
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
        path: localTarget,
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
      const upsertIdProp = idProp(propPath.sourceString)
      const extractId = idExtractor({
        type: 'UPSERT',
        isList: true,
        idProp: upsertIdProp,
      })
      const value = jsonVal.toAST()
      const targetIds = value.map(extractId)
      // console.log({ value, targetIds })
      return {
        type: 'UPSERT',
        path: propPath.sourceString,
        value,
        sourceString: this.sourceString,
        isList: true,
        isTargetedList: true,
        idProp: upsertIdProp,
        targetIds,
      } satisfies UpsertCommand
    },

    RemoveStmt(_kw, propPath, _lParen, idList, _rParen, _eol) {
      return {
        type: 'REMOVE',
        path: propPath.sourceString,
        sourceString: this.sourceString,
        isList: true,
        targetIds: idList.toAST() as Ids,
        idProp: idProp(propPath.sourceString),
        isTargetedList: true,
      } satisfies RemoveCommand
    },

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

  function idProp(dotPath = ''): IdProp | undefined {
    const currentStack = stack_current()
    const targetDescriptor = getTargetDescriptor(
      currentStack.descriptor,
      dotPath,
    )
    return targetDescriptor.type === 'array'
      ? targetDescriptor.items.type === 'object'
        ? targetDescriptor.items.idProp
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
    if (isPrimitiveDescriptor(descriptor)) {
      // console.log(inspect({ dotPath, descriptor }, { colors: true, depth: 10 }))
      throw new Error(`cannot getDescriptor ${dotPath} in ${descriptor.type}`, {
        cause: { current: descriptor, dotPath },
      })
    }

    const restDotPath = restPath.join('.')
    const nextDesc = isPrimitiveDescriptor(descriptor)
      ? getTargetDescriptor(descriptor, restDotPath)
      : descriptor.type === 'object' || descriptor.type === 'model'
        ? getTargetDescriptor(descriptor.properties[prop], restDotPath)
        : descriptor.type === 'array'
          ? getTargetDescriptor(descriptor.items, prop)
          : (() => {
              //@ts-expect-error : exhausted descriptor is never
              throw new Error(`unexpected descriptor type ${descriptor.type}`)
            })()
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
    // console.log(
    //   inspect(
    //     { inDescriptor, dotPath, targetDescriptor },
    //     { colors: true, depth: 5 },
    //   ),
    // )
    if (targetDescriptor.type !== 'array') {
      // console.log(
      //   inspect(
      //     { inDescriptor, dotPath, targetDescriptor },
      //     { colors: true, depth: 10 },
      //   ),
      // )
      throw new Error(
        `cannot selectionStack ${dotPath} in ${inDescriptor.type}: found ${targetDescriptor.type}`,
        {
          cause: { inDescriptor, dotPath, targetDescriptor },
        },
      )
    }

    return targetDescriptor
  }
}
