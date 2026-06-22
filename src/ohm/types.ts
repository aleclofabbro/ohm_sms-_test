// ==========================================
// 1. Model, Entities, Collections
// ==========================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type _any = any
export type Entity = Record<string, _any>

export type EntityCollection = Entity[]
export type EntityId = string | number
export type EntityIds = EntityId[]

export type ModelDescriptor = {
  [entityName: string]: EntityDescriptor
}

export type Model = {
  [entityName: string]: Entity[]
}

export type EntityDescriptor = IdentifiableObjectDescriptor

// ==========================================
// 2. Value Descriptors
// ==========================================

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
    [propName: string]: ValueDescriptor
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

// ==========================================
// 3. IO & Fetching
// ==========================================

export type RequireModelIO = {
  requiredModel: RequiredModel
}
export type RequiredModel = {
  [entityName: string]: EntityId[]
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

// ==========================================
// 4. AST (Abstract Syntax Tree) - OHM Output
// ==========================================

export type BaseCommand = {
  sourceString: string
}

export type SelectCommand = BaseCommand & {
  type: 'SELECT'
  target: string
  targetIds: EntityIds
}

export type ValueMutationCommand = BaseCommand & {
  type: 'SET' | 'ADD' | 'UPSERT'
  path: string
  value: _any
}

export type RemoveCommand = BaseCommand & {
  type: 'REMOVE'
  path: string
  targetIds: EntityIds
}

export type Command = ValueMutationCommand | RemoveCommand

export type CompileQueryBlock = {
  type: 'CompileQueryBlock'
  query: string
  select: SelectCommand
  commands: (Command | CompileQueryBlock)[]
}

export type CompileQueryResult = {
  queries: CompileQueryBlock[]
}

// ==========================================
// 5. Execution Pipeline - Radashi Engine
// ==========================================

export type OperationThunk = () => Promise<unknown> | unknown

export type CommandThunk = Command & {
  execute: OperationThunk
}
