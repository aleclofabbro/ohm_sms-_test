import { extractEntitiesIds } from './semantic.extractIds'

test('pipeline q1', () => {
  const entityIds = extractEntitiesIds(`
ON User(1,2,3)
  SET status: "active"
  SET role: "admin"
`)

  // console.log(JSON.stringify(pipeline, null, 2))
  expect(entityIds).toEqual({
    User: ['1','2','3']
  })
})
