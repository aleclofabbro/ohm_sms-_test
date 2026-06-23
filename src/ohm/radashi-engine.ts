import { get, set, unique } from 'radashi'
import { type CommandEngine } from './exec-query'
import type {
  Command,
  CommandThunk,
  Entity,
  SelectCommand,
  _any,
} from './types'

/**
 * Crea la pipeline di esecuzione mappando i comandi dell'AST
 * Supporta in modo ricorsivo i blocchi annidati.
 */
export const createPipeline: CommandEngine['createPipeline'] = (
  commands,
  entities,
  selectContext,
  modelDescriptor,
) => {
  const thunks: CommandThunk[] = []
  // selectContext
  for (const item of commands) {
    if (item.type === 'CompileQueryBlock') {
      thunks.push(
        ...createPipeline(
          item.commands,
          entities,
          item.select,
          modelDescriptor,
        ),
      )
    } else {
      // È una normale istruzione di mutazione
      thunks.push({
        ...item,
        execute: async () => {
          processCommand(item, entities, selectContext)
        },
      })
    }
  }

  return thunks
}

export const radashiCommandEngine: CommandEngine = {
  createPipeline,
}
/**
 * Motore di processamento centrale. Determina se l'operazione è
 * root-level o nested-level e naviga l'albero di conseguenza.
 */
function processCommand(
  command: Command,
  entities: Entity[],
  selectContext: SelectCommand,
): void {
  const parts = selectContext.target.split('.')
  const isRoot = parts.length === 1

  for (let i = 0; i < entities.length; i++) {
    if (isRoot) {
      // Modifica diretta sull'entità radice
      entities[i] = applyMutation(entities[i], command, '')
    } else {
      // Modifica su un sub-target (array annidato)
      const nestedPath = parts.slice(1).join('.')
      const nestedArray = get<Entity[]>(entities[i], nestedPath)

      if (!Array.isArray(nestedArray)) continue

      // Troviamo gli indici degli elementi che corrispondono ai targetIds
      nestedArray.forEach((item, index) => {
        const itemId = extractId(item)
        if (itemId !== undefined && selectContext.targetIds.includes(itemId)) {
          const absolutePath = `${nestedPath}.${index}`
          entities[i] = applyMutation(entities[i], command, absolutePath)
        }
      })
    }
  }
}

/**
 * Applica la singola mutazione all'oggetto basandosi sul tipo di comando.
 * Usa `radashi.set` per restituire in modo immutabile l'oggetto modificato.
 */
function applyMutation(
  entity: Entity,
  command: Command,
  basePath: string,
): Entity {
  // Costruzione del percorso completo (es. "config.items.0.status")
  const buildPath = (subPath: string) =>
    basePath ? `${basePath}.${subPath}` : subPath
  const fullPath = buildPath(command.path)
  const currentArr = get<_any[]>(entity, fullPath, [])

  switch (command.type) {
    case 'SET': {
      return set(entity, fullPath, command.value)
    }

    case 'ADD': {
      const itemsToAdd = Array.isArray(command.value)
        ? command.value
        : [command.value]

      return set(
        entity,
        fullPath,
        unique([...currentArr, ...itemsToAdd], extractId),
      )
    }

    case 'UPSERT': {
      const itemsToUpsert = Array.isArray(command.value)
        ? command.value
        : [command.value]

      return set(entity, fullPath, applyUpsertLogic(currentArr, itemsToUpsert))
    }

    case 'REMOVE': {
      const filteredArr = currentArr.filter(
        (item) =>
          !command.targetIds.includes(extractId(item) as string | number),
      )
      return set(entity, fullPath, filteredArr)
    }

    default:
      return entity
  }
}

/**
 * Helper funzionale per l'operazione di UPSERT su un array.
 * Sostituisce l'elemento se l'ID esiste, altrimenti lo accoda.
 */
function applyUpsertLogic(currentArr: Entity[], newItems: Entity[]): Entity[] {
  const result = [...currentArr]

  for (const newItem of newItems) {
    const newItemId = extractId(newItem)
    const existingIndex = result.findIndex(
      (existing) => extractId(existing) === newItemId,
    )

    if (existingIndex >= 0) {
      result[existingIndex] = newItem // Update
    } else {
      result.push(newItem) // Insert
    }
  }

  return result
}
/**
 * FIXME: richiedi e usa il ModelDescriptor per estrarre id, no euristico
 */
function extractId(item: unknown): string | number | undefined {
  if (typeof item === 'string' || typeof item === 'number') return item
  if (typeof item === 'object' && item !== null) {
    const obj = item as _any
    if (obj.id !== undefined) return obj.id
    if (obj._id !== undefined) return obj._id

    // Fallback robusto per i campi ID custom (es. 'depId', 'userId', 'sysId')
    // Cerca automaticamente una chiave che finisce con "id" (case-insensitive)
    const customIdKey = Object.keys(obj).find(
      (k) => k.toLowerCase().endsWith('id') || k.toLowerCase().endsWith('type'),
    )
    if (customIdKey) return obj[customIdKey]
  }
  return undefined
}


