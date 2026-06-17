import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import { join } from 'path'

type arg = {
  name: string
  id: string | number
  basePath: string
}

export async function entityFileReaderStr({
  id,
  name,
  basePath,
}: arg) {
  const targetFilePath = join(basePath, `${name}_${id}.json`)
  const exists = existsSync(targetFilePath)
  if (!exists) {
    return 'null'
  }
  const fileString = await readFile(targetFilePath, 'utf-8')
  return fileString
}
export async function entityFileReader({
  id,
  name,
  basePath,
}: arg) {  return JSON.parse(await entityFileReaderStr({basePath,id,name}))
}
