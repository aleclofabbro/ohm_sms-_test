import { executeQuery } from '../exec-query'
import { radashiCommandEngine } from '../radashi-engine'
import { IO, Model, ModelDescriptor } from '../types'

export type User = {
  id: { id: number }
  status: string
  friends: { friendId: number; points: number }[]
  // priority: number
  // metadata: {
  //   source: string
  //   verified: boolean
  // }
}
const io: IO = {
  async requireModel(/* { ids } */) {
    return { model }
  },
}
const model: Model = {
  users: [
    {
      id: { id: 1 },
      status: 'active',
      friends: [{ friendId: 1, points: 207 }],
    },
    {
      id: { id: 3 },
      status: 'pending',
      friends: [{ friendId: 1, points: 10 }],
    },
    {
      id: { id: 2 },
      status: 'closed',
      friends: [{ friendId: 2, points: 127 }],
    },
  ] satisfies User[],
}
const modelDescriptor: ModelDescriptor = {
  type: 'model',
  properties: {
    users: {
      type: 'array',
      items: {
        idProp: { path: 'id.id' },
        type: 'object',
        properties: {
          id: {
            type: 'object',
            properties: { id: { type: 'string' } },
          },
          status: { type: 'string' },
          // priority: { type: 'number' },
          // metadata: {
          //   type: 'object',
          //   properties: {
          //     source: { type: 'string' },
          //     verified: { type: 'boolean' },
          //   },
          // },
        },
      },
    },
  },
}

// test('test 1', async () => {
//   const query = `
// // TEST 1
// SELECT users(1, 2)
//   SET status = "xxx"
// DONE
// `
//   const execQueryRadashiResult = await executeQuery({
//     io,
//     modelDescriptor,
//     query,
//     engine: radashiCommandEngine,
//   })
//   expect(execQueryRadashiResult.model.after).toEqual({
//     users: [
//       { id: { id: 1 }, status: 'xxx', friends: [{ friendId: 1, points: 207 }] },
//       {
//         id: { id: 3 },
//         status: 'pending',
//         friends: [{ friendId: 1, points: 10 }],
//       },
//       { id: { id: 2 }, status: 'xxx', friends: [{ friendId: 2, points: 127 }] },
//     ] satisfies User[],
//   })
// })

test('test 2', async () => {
  const query = `
// TEST 2
SELECT users(1, 2)
  SELECT friends(1,2)
    SET points = 0
  DONE
DONE
`
  const execQueryRadashiResult = await executeQuery({
    io,
    modelDescriptor,
    query,
    engine: radashiCommandEngine,
  })
  expect(execQueryRadashiResult.model.after).toEqual({
    users: [
      { id: { id: 1 }, status: 'xxx', friends: [{ friendId: 1, points: 0 }] },
      {
        id: { id: 3 },
        status: 'pending',
        friends: [{ friendId: 1, points: 10 }],
      },
      { id: { id: 2 }, status: 'xxx', friends: [{ friendId: 2, points: 0 }] },
    ] satisfies User[],
  })
})
