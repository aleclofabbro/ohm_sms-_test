// import specs from './openapi.json'
import { $match, $set } from 'mingo/operators/pipeline'
import type { AnyObject } from 'mingo/types'
import grammar from '../assets/grammar.ohm-bundle'
import { Context, Aggregator, ProcessingMode } from 'mingo'
import { $map, $eq, $filter } from 'mingo/operators/expression'

export function getPipeline(query: string): AnyObject[] {
  const pipeline: AnyObject[] = []
  const semantics = grammar.createSemantics()
  .addOperation('gm()', {
    SetOp(_SetOp, dotPath, _colon, jsonString) {
      const json = jsonString.gm()
      pipeline.push({ $set: { [dotPath.sourceString]: json } })
    },
    // AddOp(_AddOp, b, c) {
    // },
    // AddSetOp(_AddSetOp, b, c) {
    // },
    // RemoveOp(_RemoveOp, b, c, d, e) {
    // },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    NestedBlock(_target, statements, _UP) {
      statements.children.map((_) => _.gm())
    },
    Query(target, statements) {
      target.gm()
      
      statements.children.map((_) => _.gm())
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Target(_ON, target, _par1, ids, _par2) {
      const targetStr = target.sourceString
      const idsStringsArr = ids
        .asIteration()
        .children.map((_) => _.sourceString)
      const idsNumArr = idsStringsArr.map((_) => parseInt(_))
      const inIdsArr = [...idsStringsArr, ...idsNumArr]

      // pipeline.push({ $match: { id: { $in: inIdsArr } } })
      pipeline.push({
        $project: {
          [targetStr]: {
            $filter: {
              input: '$a',
              as: 'el',
              cond: { $match: { '$$el.id': { $in: inIdsArr } } },
            },
          },
        },
      })
    },
    jsonMock(jsonString) {
      return JSON.parse(jsonString.sourceString)
    },
  })
  const matchResult = grammar.match(query)
  semantics(matchResult).gm()
  return pipeline
}
export function execQuery(query: string, data: AnyObject[]) {
  const pipeline = getPipeline(query)
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

