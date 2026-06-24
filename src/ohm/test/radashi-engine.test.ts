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
      //      id: { id: 1 },
      id: { id: 0 },
      status: 'active',
      friends: [{ friendId: 2, points: 207 }],
    },
    {
      //      id: { id: 3 },
      id: { id: 1 },
      status: 'pending',
      friends: [{ friendId: 1, points: 10 }],
    },
    {
      //      id: { id: 2 },
      id: { id: 2 },
      status: 'closed',
      friends: [{ friendId: 3, points: 127 }],
    },
  ] satisfies User[],
} as const
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
          friends: {
            type: 'array',
            items: {
              idProp: { path: 'friendId' },
              type: 'object',
              properties: {
                friendId: { type: 'number' },
                points: { type: 'number' },
              },
            },
          },
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

test('test 1', async () => {
  const query = `
// TEST 1
SELECT users(0, 2)
  SET status = "xxx"
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
      { ...model.users[0], status: 'xxx' },
      model.users[1],
      { ...model.users[2], status: 'xxx' },
    ],
  })
})

test('test 2', async () => {
  const query = `
// TEST 2
SELECT users(0, 2)
  SELECT friends(3,2)
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
      { ...model.users[0], friends: [{ friendId: 2, points: 0 }] },
      model.users[1],
      { ...model.users[2], friends: [{ friendId: 3, points: 0 }] },
    ],
  })
})
test('test 3', async () => {
  const query = `
// TEST 1
SELECT users(0, 1)
  ADD friends = [{"friendId": 100, "points": 2}]
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
      {
        ...model.users[0],
        friends: [...model.users[0].friends, { friendId: 100, points: 2 }],
      },
      {
        ...model.users[1],
        friends: [...model.users[1].friends, { friendId: 100, points: 2 }],
      },
      model.users[2],
    ],
  })
})
test('test 3', async () => {
  const query = `
// TEST 3
SELECT users(0, 1)
  REMOVE friends(1)
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
      model.users[0],
      {
        ...model.users[1],
        friends: [],
      },
      model.users[2],
    ],
  })
})
test('test 3', async () => {
  const query = `
// TEST 3
SELECT users(0, 1)
  UPSERT friends = [{ "friendId": 1, "points": 99 }]
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
      {
        ...model.users[0],
        friends: [...model.users[0].friends, { friendId: 1, points: 99 }],
      },
      {
        ...model.users[1],
        friends: [{ friendId: 1, points: 99 }],
      },
      model.users[2],
    ],
  })
})
