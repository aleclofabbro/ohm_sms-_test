// import specs from './openapi.json'
import type { AnyObject } from 'mingo/types'
import { compileQueryToPipeline } from './semantic.mingo'
import { Aggregator, Context, ProcessingMode } from 'mingo'
import { $eq, $filter, $map, $let, $in, $concatArrays, $ifNull, $mergeObjects, $cond, $not } from 'mingo/operators/expression'
import { $match, $set } from 'mingo/operators/pipeline'

export function execQuery(query: string, model: AnyObject[]) {
  const pipeline = compileQueryToPipeline(query)
  const context = Context.init({
    pipeline: { $match, $set },
    expression: { $eq, $map, $filter, $let, $in, $concatArrays, $ifNull, $mergeObjects, $cond, $not },
    // projection: {},
    // accumulator: {},
    // query: {},
    // window: {},
  })
  const aggregator = new Aggregator(pipeline, {
    context,
    processingMode: ProcessingMode.CLONE_OFF,
  })
  return aggregator.run(model)
}

