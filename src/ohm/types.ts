// Model, Entities, Collections

import { get } from 'radashi'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type _any = any
export type Obj = Record<string, _any>
export type Entity = Obj

export type EntityCollection = Entity[]
export type Id = string | number
export type Ids = Id[]

export type ModelDescriptor = {
  type: 'model'
  properties: {
    [entityName: string]: EntityCollectionDescriptor
  }
}

export type Model = {
  [entityName: string]: EntityCollection
}

export type EntityCollectionDescriptor =
  ArrayDescriptor<IdentifiableObjectDescriptor>

export type SomeDescriptor =
  | ValueDescriptor
  | ModelDescriptor
  | EntityCollectionDescriptor

// Value Descriptors
export const isPrimitiveDescriptor = (
  desc: SomeDescriptor,
): desc is PrimitiveDescriptor =>
  !(desc.type === 'array' || desc.type === 'model' || desc.type === 'object')
export type ValueDescriptor =
  | PrimitiveDescriptor
  | ObjectDescriptor
  | ArrayDescriptor
  | IdentifiableObjectDescriptor

export type PrimitiveDescriptor = {
  type: 'number' | 'string' | 'boolean'
}

type ArrayItem = IdentifiableObjectDescriptor | PrimitiveDescriptor

export type ArrayDescriptor<items extends ArrayItem = ArrayItem> = {
  type: 'array'
  items: items
}

type _WithObjectProps = {
  properties: {
    [propName: string]: ValueDescriptor
  }
}

export type ObjectDescriptor = _WithObjectProps & {
  type: 'object'
}

export type IdProp = {
  path: string
}

export const idExtractor =
  (command: Pick<Command | SelectCommand, 'type' | 'isList' | 'idProp'>) =>
  (item: _any) => {
    const idProp =
      command.type === 'SELECT'
        ? command.idProp
        : !command.isList
          ? undefined
          : command.idProp

    return !idProp ? item : get<unknown>(item, idProp.path)
  }

export type IdentifiableObjectDescriptor = ObjectDescriptor & {
  idProp: IdProp
}

export type RequireModelIO = {
  requiredModel: RequiredModel
}
export type RequiredModel = {
  [entityName: string]: Id[]
}

export type IO = {
  requireModel: (_: RequireModelIO) => Promise<RequireModelResult>
}

export type RequireModelResult = {
  model: Model
  // unvailable: {
  //   [entityName in string]: {
  //     id: EntityId
  //   }
  // }[]
}

// OHM - AST Output

type _base_command_<list extends 'no' | 'simple' | 'targetIds' = 'no'> = {
  sourceString: string
  path: string
  isList: list extends 'no' ? false : true
  isTargetedList: list extends 'targetIds' ? true : false
} & (list extends 'targetIds'
  ? {
      targetIds: Ids
      idProp: IdProp | undefined
    }
  : {
      targetIds?: undefined
      idProp?: undefined
    })

export type SetCommand = _base_command_ & {
  type: 'SET'
  value: _any
}
export type SelectCommand = _base_command_<'targetIds'> & {
  type: 'SELECT'
}
export type AddCommand = _base_command_<'simple'> & {
  type: 'ADD'
  value: _any[]
}

export type RemoveCommand = _base_command_<'targetIds'> & {
  type: 'REMOVE'
}
export type UpsertCommand = _base_command_<'targetIds'> & {
  type: 'UPSERT'
  value: _any[]
}

export type Command =
  | SetCommand
  | RemoveCommand
  | UpsertCommand
  | AddCommand
  | SetCommand

export type SelectBlock = {
  type: 'SelectBlock'
  query: string
  select: SelectCommand
  commands: (Command | SelectBlock)[]
}

export type CompileQueryResult = {
  selectBlocks: SelectBlock[]
}
