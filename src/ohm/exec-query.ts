/* eslint-disable preserve-caught-error */
import { cloneDeep, get, set, unique } from 'radashi'
import { compileQuery } from './semantic'
import {
  idExtractor,
  type _any,
  type Command,
  type CompileQueryResult,
  type IO,
  type Model,
  type ModelDescriptor,
  type Obj,
  type RequiredModel,
  type SelectBlock,
} from './types'

// type CommandEngineCreatePipelineArg = {
//   selectBlock: SelectBlock
//   entities: Entity[]
//   modelDescriptor: ModelDescriptor
// }
export type CommandEngineProcessCommandArg = {
  command: Command
  overObj: Obj
}

export interface CommandEngine {
  //createPipeline(_: CommandEngineCreatePipelineArg): CommandThunk[]
  processCommand(_: CommandEngineProcessCommandArg): Obj
}
export type ExecResult = {
  model: {
    before: Model
    after: Model
  }
  compile: {
    result: CompileQueryResult
  }
}
type executeQueryArg = {
  query: string
  io: IO
  engine: CommandEngine
  modelDescriptor: ModelDescriptor
}

/**
 * Esegue il risultato della compilazione iterando sui blocchi SELECT.
 */
export async function executeQuery({
  io,
  query,
  engine,
  modelDescriptor,
}: executeQueryArg): Promise<ExecResult> {
  const compileQueryResult = compileQuery(query, modelDescriptor)
  const requiredModel = compileQueryResult.selectBlocks.reduce<RequiredModel>(
    (acc, selectBlock) => {
      const requiredEntityName = selectBlock.select.path
      const requiredEntityIds = selectBlock.select.targetIds
      const currentIds = (acc[requiredEntityName] =
        acc[requiredEntityName] ?? [])
      const uniqueIds = unique([...currentIds, ...requiredEntityIds])
      return {
        ...acc,
        [requiredEntityName]: uniqueIds,
      }
    },
    {},
  )
  const fetchResult = await io.requireModel({ requiredModel })

  const before = fetchResult.model
  const after = compileQueryResult.selectBlocks.reduce(
    (overObj, selectBlock) =>
      processSelectBlock({ selectBlock, engine, overObj }),
    cloneDeep(fetchResult.model),
  )

  //   thunkPipeline.forEach((thunk) => {
  //     try {
  //       return thunk.execute()
  //     } catch (error) {
  //       console.error(error)
  //       throw new Error(
  //         `
  // DEBUG:
  // Errore durante l'esecuzione del comando: ${thunk.type} at path '${thunk.path}'
  // Sorgente: ${thunk.sourceString}
  // Dettaglio: ${(error as Error).message}
  // `.trimEnd(),
  //         // { cause: error },
  //       )
  //     }
  //   })

  return {
    compile: {
      result: compileQueryResult,
    },
    model: {
      after,
      before,
    },
  }
}

function processSelectBlock({
  selectBlock,
  overObj,
  engine,
}: {
  selectBlock: SelectBlock
  engine: CommandEngine
  overObj: Obj
}): Obj {
  const overArray = get(overObj, selectBlock.select.path, [] as _any[])
  if (!Array.isArray(overArray)) {
    throw new Error(
      `
DEBUG:
Non posso processSelectBlock: at path '${selectBlock.select.path} trovato ${typeof overArray}'
`.trimEnd(),
      // { cause: error },
    )
  }
  const modArray = overArray.map((currentOverObj) =>
    selectBlock.commands.reduce((overObj, command) => {
      if (command.type === 'SelectBlock') {
        return processSelectBlock({
          selectBlock: command,
          overObj: get<Obj[]>(overObj, command.select.path),
          engine,
        })
      }
      const targetIds = selectBlock.select.targetIds
      const objId = idExtractor(selectBlock.select)(overObj)
      if (!targetIds.includes(objId)) {
        return overObj
      }
      return engine.processCommand({
        command,
        overObj,
      })
    }, currentOverObj),
  )
  console.log(JSON.stringify({ overArray, modArray }, null, 2))
  return set(overObj, selectBlock.select.path, modArray)
}