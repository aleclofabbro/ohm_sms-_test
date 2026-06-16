import { compileQueryToPipeline } from './semantic.mingo'

test('pipeline q1', () => {
  const pipeline = compileQueryToPipeline(`
ON User(1,2,3)
  SET status: "active"
  SET role: "admin"
`)
  // console.log(JSON.stringify(pipeline, null, 2))
  expect(pipeline).toEqual([
    {
      $set: {
        User: {
          $let: {
            vars: {
              arrayOriginale: {
                $ifNull: ['$User', []],
              },
            },
            in: {
              $map: {
                input: '$$arrayOriginale',
                as: 'CURRENT_ITEM',
                in: {
                  $mergeObjects: [
                    '$$CURRENT_ITEM',
                    {
                      $cond: {
                        if: {
                          $in: ['$$CURRENT_ITEM.id', ['1', '2', '3', 1, 2, 3]],
                        },
                        then: {
                          status: 'active',
                          role: 'admin',
                        },
                        else: {},
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
  ])
})
