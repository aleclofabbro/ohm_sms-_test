/* eslint-disable preserve-caught-error */
import { cloneDeep } from 'radashi'
import type {
  Command,
  CommandThunk,
  CompileQueryBlock,
  CompileQueryResult,
  Entity,
  IO,
  Model,
  ModelDescriptor,
  RequiredModel,
  SelectCommand,
} from './types'

/**
 * Contratto che il modulo di esecuzione (es. radashi-engine) deve rispettare.
 * Il suo compito è puramente mappativo: riceve l'AST e i dati, e restituisce
 * le funzioni eseguibili (thunks).
 */
export interface CommandEngine {
  createPipeline(
    commands: (Command | CompileQueryBlock)[], // Supporta l'union type
    entities: Entity[],
    selectContext: SelectCommand,
    modelDescriptor: ModelDescriptor,
  ): CommandThunk[]
}
export type ExecResult = {
  model: {
    before: Model
    after: Model
  }
}
/**
 * Esegue il risultato della compilazione iterando sui blocchi SELECT.
 */
export async function executeQuery(
  compileQueryResult: CompileQueryResult,
  io: IO,
  engine: CommandEngine,
  modelDescriptor: ModelDescriptor,
): Promise<ExecResult> {
  const requiredModel = compileQueryResult.queries.reduce<RequiredModel>(
    (acc, compileQueryBlock) => {
      const requiredEntityName = compileQueryBlock.select.target
      const requiredEntityIds = compileQueryBlock.select.targetIds
      const currentIds = (acc[requiredEntityName] =
        acc[requiredEntityName] ?? [])
      const uniqueIds = [...new Set([...currentIds, ...requiredEntityIds])]
      return {
        ...acc,
        [requiredEntityName]: uniqueIds,
      }
    },
    {},
  )
  const fetchResult = await io.requireModel({ requiredModel })

  const before = cloneDeep(fetchResult.model)
  const after = cloneDeep(fetchResult.model)
  for (const block of compileQueryResult.queries) {
    const { select, commands /* ,query */ } = block
    const entityName = select.target

    const pipeline = engine.createPipeline(
      commands,
      after[entityName] ?? [],
      select,
      modelDescriptor,
    )

    for (const thunk of pipeline) {
      try {
        thunk.execute()
      } catch (error) {
        throw new Error(
          `
Errore durante l'esecuzione del comando: ${thunk.type} at path '${thunk.path}'
Sorgente: ${thunk.sourceString}
Dettaglio: ${(error as Error).message}
`.trimEnd(),
          // { cause: error },
        )
      }
    }
  }
  return {
    model: {
      after,
      before,
    },
  }
}
