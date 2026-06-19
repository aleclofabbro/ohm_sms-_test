import type { AnyObject } from 'mingo/types'
import type { CompileQueryResult } from './mingo-semantic'

// Model, Entities, Collections
export type EntityCollection = AnyObject[]
export type Model = {
  [entityName in string]: EntityCollection
}
export type EntityId = string | number
export type EntityIds = string[] | number[]

export type ModelDescriptor = {
  [entityName in string]: EntityDescriptor
}
export type EntityDescriptor = IdentifiableObjectDescriptor

// Values
export type ValueDescriptor =
  | PrimitiveDescriptor
  | ObjectDescriptor
  | ArrayDescriptor
export type PrimitiveDescriptor = {
  type: 'number' | 'string' | 'boolean'
}
export type ArrayDescriptor = {
  type: 'array'
  elemDescriptor: IdentifiableObjectDescriptor | PrimitiveDescriptor
}

type _WithObjectProps = {
  props: {
    [propName in string]: ValueDescriptor
  }
}
export type ObjectDescriptor = _WithObjectProps & {
  type: 'object'
}
export type IdentifiableObjectDescriptor = ObjectDescriptor & {
  idProp: {
    name: string
  }
}

// quali id entita' sono state selzionate nella query 
export type SelectedEntities = {
  [entityName in string]: {
    ids: EntityIds
  }
}


// IO
export type ModelRequirements = Pick<CompileQueryResult,'selectedEntities'>
export type IO = {
  requireModel: (_: ModelRequirements) => Promise<RequireModelResult>
}
export type RequireModelResult = {
  model: Model
  // notAvailable: {
  //   [entityName in string]: {
  //     id: EntityId
  //   }
  // }[]
}
//
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type _any = any
