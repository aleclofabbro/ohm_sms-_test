import { inspect } from 'util'
import { compileQueryToPipeline } from './semantic'

test('pipeline q1', () => {
  const x = compileQueryToPipeline(`
ON User(1,2,3)
  SET status: "active"
  SET role: "admin"
`)
  console.log(inspect(x, { colors: true, depth: 20 }))
  expect(x).toEqual({
      // User: [
      //   ON_ids_stage([1, 2, 3]),
      //   { $set: { status: 'active' } },
      //   { $set: { role: 'admin' } },
      // ],
    }
  )
})

function ON_ids_stage(ids: string[] | number[]) {
  const ints = ids.map((_) => parseInt(`${_}`))
  const strings = ids.map(String)
  const inIds = [...strings, ...ints]
  return { $match: { id: { $in: inIds } } }
}
