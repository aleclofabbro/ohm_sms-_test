import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function entityFileReader({
  id,
  name,
  basePath,
}: {
  name: string
  id: string | number
  basePath: string
}) {
  const targetFilePath = join(basePath, `${name}_${id}.json`)
  const exists = existsSync(targetFilePath)
  if (!exists) {
    return null
  }
  const fileString = await readFile(targetFilePath, 'utf-8')
  return JSON.parse(fileString)
}
