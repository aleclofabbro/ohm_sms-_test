import { get, group, replace, set, unique } from 'radashi'
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

          return set(
            overObj,
            command.path,
            unique(
              [...itemsToAdd, ...get(overObj, command.path, [])],
              extractId,
            ),
          )
        }

        case 'UPSERT': {
          const itemsToUpsert = Array.isArray(command.value)
            ? command.value
            : [command.value]

          const { toAdd = [], toReplace = [] } = group(itemsToUpsert, (item) =>
            get(overObj, command.path, [])
              .map(extractId)
              .includes(extractId(item))
              ? 'toReplace'
              : 'toAdd',
          )
          const replaced = toReplace.reduce((acc, withItem) => {
            return replace(acc, withItem, (item) => extractId(item))
          }, [])
          return [...replaced, ...toAdd]
        }

        case 'REMOVE': {
          const filteredArr = get(overObj, command.path, []).filter(
            (item) => !command.targetIds.includes(extractId(item)),
          )
          return filteredArr
        }

        default:
          return overObj
      }
    })(),
  )
}
