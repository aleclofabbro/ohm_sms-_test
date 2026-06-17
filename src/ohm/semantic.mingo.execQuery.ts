// import specs from './openapi.json'
import { Aggregator, Context, ProcessingMode } from 'mingo'
import { $concatArrays, $cond, $eq, $filter, $ifNull, $in, $let, $map, $mergeObjects, $not } from 'mingo/operators/expression'
import { $match, $set } from 'mingo/operators/pipeline'
import { compileQueryToPipeline } from './semantic.mingo'
import type { Model } from './semantic.types'

export function execQuery(query: string, model: Model) {
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
  const [result] = aggregator.run([model])
  return result
}

