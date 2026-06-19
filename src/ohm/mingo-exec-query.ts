import { Context, updateMany } from 'mingo'
import {
  $concatArrays,
  $cond,
  $eq,
  $filter,
  $ifNull,
  $in,
  $let,
  $map,
  $mergeObjects,
  $not,
} from 'mingo/operators/expression'
import { $match, $set } from 'mingo/operators/pipeline'
import { compileQuery } from './mingo-semantic'
import type { IO, Model, ModelDescriptor } from './types'

export type ExecDeps = {
  io: IO
  query: string
  modelDescriptor: ModelDescriptor
}
export type execQueryResult = {
  results: {
    [x: string]: {
      matchedCount: number
      modifiedCount: number
      operation: string
    }[]
  }
}
export async function execQuery({ modelDescriptor, query, io }: ExecDeps) {
  const compileQueryResult = compileQuery({ modelDescriptor, query })
  const requireModelResult = await io.requireModel(compileQueryResult)
  // console.log({requireModelResult})
  const updatedModel: Model = JSON.parse(
    JSON.stringify(requireModelResult.model),
  )
  const context = Context.init({
    pipeline: { $match, $set },
    expression: {
      $eq,
      $map,
      $filter,
      $let,
      $in,
      $concatArrays,
      $ifNull,
      $mergeObjects,
      $cond,
      $not,
    },
    // projection: {},
    // accumulator: {},
    // query: {},
    // window: {},
  })
  const pipelineResults = compileQueryResult.results.map(
    ({ entityName, idsCondition, pipeline }) => {
      const collection = updatedModel[entityName]
      if(!collection){
        throw new Error(`missing collection for entity ${entityName}`)
      }

      // credo che updateMany modifica in-place la collection
      // ma non capisco il `updateConfig.cloneMode` a cosa serve allora..
      //
      const operationResult = pipeline.map(
        ({ condition, modifier, options, updateConfig, operation }) => ({
          operation,
          ...updateMany(
            collection,
            { $and: [idsCondition, condition] },
            modifier,
            updateConfig,
            {
              ...options,
              context,
            },
          ),
        }),
      )
      return { entityName, operationResult, collection }
    },
  )

  return {
    compileQueryResult,
    requireModelResult,
    pipelineResults,
    updatedModel,
  }
}
