import { fetchModel } from './fetchModel'
import { entityFileReader } from './fetch-local-fs/entityFileReader._.test'

test('fetchModel', async () => {
  const model = await fetchModel({
    query: `
ON Channel(102052,808,100411,100454,100646,100786,100941,101740,101932)
  SET status: "active"
  SET role: "admin"
`,
    io: {
      async fetchEntityByIds({ ids, name }) {
        const entities = await Promise.all(ids.map((id) => entityFileReader({ name, id, basePath:'../entities'})))
        return { entities }
      },
    },
  })

  // console.log(JSON.stringify(pipeline, null, 2))
  expect(model.Channel).not.toBeFalsy()
})
