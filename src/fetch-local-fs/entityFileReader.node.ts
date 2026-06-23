import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import { join } from 'path'

type arg = {
  name: string
  id: string | number
  basePath: string
}

export async function entityFileReaderStr({ id, name, basePath }: arg) {
  const targetFilePath = join(basePath, `${name}_${id}.json`)
  const exists = existsSync(targetFilePath)
  if (!exists) {
    return 'null'
  }
  const fileString = await readFile(targetFilePath, 'utf-8')
  return fileString
}
export async function entityFileReader({ id, name, basePath }: arg) {
  const object = JSON.parse(await entityFileReaderStr({ basePath, id, name }))
  // object.id = object.id.id
  // return ________________________REFACTOR_ARRAY_ITEMS(object)
  return object
}
/* 
function ________________________REFACTOR_ARRAY_ITEMS(object: any) {
  function entryReducer(acc: [string, any][], [k, val]: [string, any]) {
    const entry: [string, any] = [
      k,
      Array.isArray(val)
        ? val.map((item) => {
            if (!item || typeof item !== 'object') {
              return { id: item }
            }
            const itemKeys = Object.keys(item)
            const itemIdProp = itemKeys.find(
              (_) => _.endsWith('Id') || _.endsWith('Type'),
            )
            if (!itemIdProp) {
              return item
            }
            const refactoredItem = {
              ...item,
              id: item[itemIdProp],
              [itemIdProp]: undefined,
            }
            delete refactoredItem.itemIdProp
            return ________________________REFACTOR_ARRAY_ITEMS(refactoredItem)
          })
        : val,
    ] as const
    return [...acc, entry]
  }
  const __ = Object.entries(object).reduce(entryReducer, [] as [string, any][])
  return Object.fromEntries(__)
}
 */