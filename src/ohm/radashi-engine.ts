import { get, replaceOrAppend, set, unique } from 'radashi'
import {
  type CommandEngine,
  type CommandEngineProcessCommandArg,
} from './exec-query'
import { idExtractor } from './types'

export const radashiCommandEngine: CommandEngine = {
  processCommand: ({ command, overObj }) => applyMutation({ overObj, command }),
}
const applyMutation: CommandEngine['processCommand'] = ({
  overObj,
  command,
}) => {
  const mutatedValue = mutateValue({ overObj, command })
  return set(overObj, command.path, mutatedValue)
}
function mutateValue({ overObj, command }: CommandEngineProcessCommandArg) {
  const extractId = idExtractor(command)
  switch (command.type) {
    case 'SET': {
      return command.value
    }

    case 'ADD': {
      const itemsToAdd = [command.value].flat()

      return unique(
        [...get(overObj, command.path, []), ...itemsToAdd],
        extractId,
      )
    }

    case 'UPSERT': {
      const itemsToUpsert = [command.value].flat()
      const targetArray = get(overObj, command.path, [])
      const upsertedArray = itemsToUpsert.reduce(
        (upsertArray, upsertingItem) =>
          replaceOrAppend(
            upsertArray,
            upsertingItem,
            (currentItem) =>
              extractId(currentItem) === extractId(upsertingItem),
          ),
        targetArray,
      )

      return upsertedArray
    }

    case 'REMOVE': {
      const targetArray = get(overObj, command.path, [])
      const filteredArr = targetArray.filter(
        (item) => !command.targetIds.includes(extractId(item)),
      )
      return filteredArr
    }

    default:
      return (() => {
        //@ts-expect-error : exhausted command is never
        throw new Error(`unexpected command type ${command.type}`)
      })()
  }
}