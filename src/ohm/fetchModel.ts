import type { AnyObject } from 'mingo/types'
import { extractEntitiesIds } from './semantic.extractIds'

export type IO = {
  fetchEntityByIds: (_: {
    ids: (number | string)[]
    name: string
  }) => Promise<{ entities: AnyObject[] }>
}

export type Model = {
  [entityName in string]: AnyObject[]
}

export async function fetchModel({ io, query }: { query: string; io: IO }) {
  const extractedIds = extractEntitiesIds(query)
  const modelsPromise = Object.entries(extractedIds).map(([name, ids]) =>
    io
      .fetchEntityByIds({ ids, name })
      .then(({ entities }) => ({ [name]: entities })),
  )
  const models = await Promise.all(modelsPromise)
  const model = models.reduce(
    (model, result) => ({ ...model, ...result }),
    {} as Model,
  )

  return model
}
