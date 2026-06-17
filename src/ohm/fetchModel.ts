import { extractEntitiesIds } from './semantic.extractIds'
import type { IO, Model } from './semantic.types'

export async function fetchModel({ io, query }: { query: string; io: IO }):Promise<Model> {
  const extractedIds = extractEntitiesIds(query)
  const modelsPromise = Object.entries(extractedIds).map(([name, ids]) =>
    io
      .fetchEntitiesById({ ids, name })
      .then(({ entities }) => ({ [name]: entities })),
  )
  const models = await Promise.all(modelsPromise)
  const model = models.reduce(
    (model, result) => ({ ...model, ...result }),
    {} as Model,
  )

  return model
}
