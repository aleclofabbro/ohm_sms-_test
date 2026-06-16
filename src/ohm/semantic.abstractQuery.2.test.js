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
// {
//   $set: {
//     'User.status': {
//       $cond: {
//         if: { $in: ['$User.id', [1, 2, 3]] },
//         then: { $concat: ['status_x_', { $toString: '$User.id' }] },
//         else: '$status'
//       }
//     },
//     'User.role': {
//       $cond: {
//         if: { $in: ['$User.id', [1, 2, 3]] },
//         then: { $concat: ['role_x_', { $toString: '$User.id' }] },
//         else: '$role'
//       }
//     },

//   }
// }
const aggregator = new Aggregator([
  { $unwind: { path: '$User', preserveNullAndEmptyArrays: true } },
  {
    $set: {
      User: {
        $mergeObjects: [
          '$User',
          {
            $cond: {
              if: { $in: ['$User.id', [1, 2, 3]] },
              then: {
                status: { $concat: ['status_x_', { $toString: '$User.id' }] },
                role: { $concat: ['role_x_', { $toString: '$User.id' }] },
              },
              else: {}
            }
          }
        ]
      }
    }
  }
],
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
const resultInspectStr = inspect(result, { depth: 10, colors: true, sorted: true })
const modelInspectStr = inspect(Model, { depth: 10, colors: true, sorted: true })
console.log(modelInspectStr)
console.log(resultInspectStr)
console.log(modelInspectStr === resultInspectStr)