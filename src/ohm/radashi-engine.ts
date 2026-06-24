import { get, replaceOrAppend, set, unique } from 'radashi'
import { type CommandEngine } from './exec-query'
import { idExtractor, type Command, type Obj } from './types'

export const radashiCommandEngine: CommandEngine = {
  processCommand: ({ command, overObj }) => applyMutation({ overObj, command }),
}
function applyMutation({
  overObj,
  command,
}: {
  overObj: Obj
  command: Command
}) {
  const extractId = idExtractor(command)
  return set(
    overObj,
    command.path,
    (() => {
      switch (command.type) {
        case 'SET': {
          return command.value
        }

        case 'ADD': {
          const itemsToAdd = Array.isArray(command.value)
            ? command.value
            : [command.value]

          return unique(
            [...get(overObj, command.path, []), ...itemsToAdd],
            extractId,
          )
        }

        case 'UPSERT': {
          const itemsToUpsert = [command.value].flat()
          const targetArray = get(overObj, command.path, [])
          const upsertedArray = itemsToUpsert.reduce((upsertArray, item) => {
            const partialUpsertedArray = replaceOrAppend(
              upsertArray,
              item,
              (_it) => {
                const extractId__it = extractId(_it)
                const extractId_item = extractId(item)
                // console.log({
                //   upsertArray,
                //   item,
                //   extractId__it,
                //   extractId_item,
                // })
                return extractId__it === extractId_item
              },
            )
            return partialUpsertedArray
          }, targetArray)

          return upsertedArray
        }

        case 'REMOVE': {
          const targetArray = get(overObj, command.path, [])
          const filteredArr = targetArray.filter((item) => {
            const itemId = extractId(item)
            // console.log({
            //   itemId,
            //   item,
            //   commandTargetIds: command.targetIds,
            // })
            return !command.targetIds.includes(itemId)
          })
          // console.log({
          //   targetArray,
          //   filteredArr,
          //   commandTargetIds: command.targetIds,
          // })
          return filteredArr
        }

        default:
          return overObj
      }
    })(),
  )
}
