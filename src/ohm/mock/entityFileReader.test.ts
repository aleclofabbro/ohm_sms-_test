import { fetchEntityById } from './entityFileReader._.test'

test('autotest', async () => {
  const channel = await fetchEntityById('Fare',3990,'../entities')
  expect(channel).not.toBeNull()
  expect(channel).toBeInstanceOf(Object)
})