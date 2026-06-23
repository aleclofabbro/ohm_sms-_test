import { executeQuery } from '../exec-query'
import { radashiCommandEngine } from '../radashi-engine'
import { IO, Model, ModelDescriptor } from '../types'

export type User = {
  id: { id: number }
  status: string
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
    { id: { id: 1 }, status: 'active' },
    { id: { id: 3 }, status: 'pending' },
    { id: { id: 2 }, status: 'closed' },
  ] satisfies User[],
}
const modelDescriptor: ModelDescriptor = {
  users: {
    idProp: { path: 'id.id' },
    type: 'object',
    properties: {
      id: { type: 'object', properties: { id: { type: 'string' } } },
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
}

test('test 1', async () => {
  const query = `
// TEST 1
SELECT users(1, 2)
  SET status = "active"
DONE
`
  const execQueryRadashiResult = await executeQuery({
    io,
    modelDescriptor,
    query,
    engine: radashiCommandEngine,
  })
  // console.log(inspect(execQueryRadashiResult, { depth: 10, colors: true }))
  expect(execQueryRadashiResult.model.after).toEqual({
    users: [
      { id: { id: 1 }, status: 'active' },
      { id: { id: 3 }, status: 'pending' },
      { id: { id: 2 }, status: 'active' },
    ] satisfies User[],
  })
})
