import { Aggregator, Context, ProcessingMode } from 'mingo'
import { $eq, $filter, $in, $map, $concat, $mergeObjects } from 'mingo/operators/expression'
import { $facet, $match, $set, $unwind, $group, $unset, $addFields } from 'mingo/operators/pipeline'
import { inspect } from 'util'

const context = Context.init({
  pipeline: { $match, $set, $facet, $filter, $unwind, $mergeObjects, $map },
  expression: { $eq, $map, $filter, $in, $concat/* , $unwind */ },
  accumulator: { $match, $facet/* , $unwind */ },
  projection: {},
  query: {},
  window: {},
})
const aggregator = new Aggregator(
  [{
    $set: {
      User: {
        $map: {
          input: { $ifNull: ['$User', []] },
          as: 'item',
          in: {
            $mergeObjects: [
              "$$item",
              {
                $cond: {
                  if: { $in: ['$$item.id', [1, 2, 3]] },
                  then: {
                    status: { $concat: ['status_x_', { $toString: '$$item.id' }] },
                    role: { $concat: ['role_x_', { $toString: '$$item.id' }] },
                    objs: {
                      $map: {
                        input: { $ifNull: ['$$item.objs', []] },
                        as: 'item',
                        in: {
                          $mergeObjects: [
                            "$$item",
                            {
                              $cond: {
                                if: { $in: ['$$item.t', ['xxxxx']] },
                                then: {
                                  t: 'YYYYY'
                                }, else: {}
                              }
                            },
                          ]
                        }
                      }
                    }
                  }, else: {}
                }
              },
            ]
          }
        }
      }
    }
  }],
  {
    context,
    processingMode: ProcessingMode.CLONE_INPUT,
  },
)
const Model = [{
  User: [
    { id: 4, status: 'status_4', role: 'role_4', objs: [{ t: 'tag_4' }, { t: 'tag_x' }] },
    { id: 1, status: 'status_1', role: 'role_1', objs: [{ t: 'xxxxx' }, { t: 'tag_x' }] },
    { id: 2, status: 'status_2', role: 'role_2', objs: [{ t: 'tag_2' }, { t: 'xxxxx' }] },
    { id: 3, status: 'status_3', role: 'role_3', objs: [{ t: 'xxxxx' }, { t: 'tag_y' }] },
  ]
}]
const result = aggregator.run(Model)
console.log(inspect(Model, { depth: 10, colors: true }))
console.log(inspect(result, { depth: 10, colors: true }))
