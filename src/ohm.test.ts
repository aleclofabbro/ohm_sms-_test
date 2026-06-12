import { gm } from './ohm'
test('q1', () => {
  const x = gm(q1)
  console.log(x)
  expect(x).toEqual([
    // { $match: { id: { $in: ['1','2','3'] } } },
    // { $set: { status: 'active' } },
    // { $set: { role: 'admin' } },
  ])
});

const q1 = `
ON User(1,2,3)
  SET status: "active"
  SET role: "admin"
  ON gip(1,2)
    SET x: 1
    ON gip(1,2)
      SET x: 1
    UP
    SET x: 1
  UP
`