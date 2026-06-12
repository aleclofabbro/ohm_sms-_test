import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { join } from 'path';

const BASE_PATH = '../entities'
export async function fetchEntityById(name: string, id: string | number){
  const targetFilePath = join(BASE_PATH, `${name}_${id}.json` )
  const exists  = existsSync(targetFilePath)
  if(!exists){
    return null
  }
  const fileString = await readFile(targetFilePath,'utf-8')
  return JSON.parse(fileString)
}

test('autotest', async () => {
  const channel = await fetchEntityById('Fare',3990)
  expect(channel).not.toBeNull()
  expect(channel).toBeInstanceOf(Object)
})