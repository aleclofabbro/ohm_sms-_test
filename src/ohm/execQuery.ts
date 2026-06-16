// import specs from './openapi.json'
import { Aggregator, Context, ProcessingMode } from 'mingo'
import { $eq, $filter, $map } from 'mingo/operators/expression'
import { $match, $set } from 'mingo/operators/pipeline'
import type { AnyObject } from 'mingo/types'
import { compileQueryToPipeline } from './semantic'

export function execQuery(query: string, data: AnyObject[]) {
  const pipeline = compileQueryToPipeline(query)
  const context = Context.init({
    pipeline: { $match, $set },
    expression: { $eq, $map,$filter },
    // projection: {},
    // accumulator: {},
    // query: {},
    // window: {},
  })
  const aggregator = new Aggregator(pipeline, {
    context,
    processingMode: ProcessingMode.CLONE_OFF,
  })
  return aggregator.run(data)
}

