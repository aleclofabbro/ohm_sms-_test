import { execQuery } from './semantic.mingo.execQuery'
export const User: User<string>[] = [
  { id: '1', status: 'status_1', role: 'role_1' },
  { id: '2', status: 'status_2', role: 'role_2' },
  { id: '3', status: 'status_3', role: 'role_3' },
  { id: '4', status: 'status_4', role: 'role_4' },
]
export const Model = {
  User,
}

test('execQuery q1', () => {
  const result = execQuery(
    `
ON User(1,2,3)
  SET status: "active"
  SET role: "admin"
`,
    Model,
  )
  expect(result).toEqual([
    {
      User: [
        { id: '1', status: 'active', role: 'admin' },
        { id: '2', status: 'active', role: 'admin' },
        { id: '3', status: 'active', role: 'admin' },
        { id: '4', status: 'status_4', role: 'role_4' },
      ],
    },
  ])
})
type User<idType extends string | number = number> = {
  id: idType
  status: string
  role: string
}
