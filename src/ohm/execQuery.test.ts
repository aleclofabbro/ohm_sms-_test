import { execQuery } from './execQuery'
import { Users } from './semantic._.test'

test('execQuery q1', () => {
  const result = execQuery(`
ON User(1,2,3)
  SET status: "active"
  SET role: "admin"
`, [{Users}])
  expect(result).toEqual([
    { id: 1, status: 'active', role: 'admin' },
    { id: 2, status: 'active', role: 'admin' },
    { id: 3, status: 'active', role: 'admin' },
  ])
})


