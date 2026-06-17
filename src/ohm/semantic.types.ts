import type { AnyObject } from 'mingo/types';

export type ModelIds = {
  [entityName in string]: string[]
}
export type Model = {
  [entityName in string]: AnyObject[]
}
export type IO = {
  fetchEntitiesById: (_: {
    ids: string[]
    name: string
  }) => Promise<{ entities: AnyObject[]} >
}

