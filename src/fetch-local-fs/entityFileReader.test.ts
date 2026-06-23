import { entityFileReader } from './entityFileReader.node'

test('autotest', async () => {
  const channel = await entityFileReader({
    name: 'Fare',
    id: 3990,
    basePath: '../entities',
  })
  expect(channel).not.toBeNull()
  expect(channel).toBeInstanceOf(Object)
})
