import { execQuery } from './execQuery'
const Model1 = [
  {
    User: [
      { id: 1, status: 'status_1', role: 'role_1' },
      { id: 2, status: 'status_2', role: 'role_2' },
      { id: 3, status: 'status_3', role: 'role_3' },
      { id: 4, status: 'status_4', role: 'role_4' },
    ],
  },
]
test('execQuery q1', () => {
  const result = execQuery(
    `
ON User(1,2,3)
  SET status: "active"
  SET role: "admin"
`,
    Model1,
  )
  expect(result).toEqual([
    {
      User: [
        { id: 1, status: 'active', role: 'admin' },
        { id: 2, status: 'active', role: 'admin' },
        { id: 3, status: 'active', role: 'admin' },
        { id: 4, status: 'status_4', role: 'role_4' },
      ],
    },
  ])
})
