import { createContext, useContext } from 'react'
import type { IO, Model } from './ohm/types'
import type { ExecResult } from './ohm/exec-query'
export type IOContextType = {
  io: IO
}
export type CompilationResult =
  | {
      success: true
      error?: undefined
      result: ExecResult
    }
  | {
      success: false
      error: unknown
      result?: undefined
    }

export interface DiffResult {
  before: Model
  after: Model
}

interface ResultContextType {
  model: Model
  setModel: (data: Model) => void
  queryResult: DiffResult | null
  // setQueryResult: (result: DiffResult | null) => void
}

export const ResultContext = createContext<ResultContextType | undefined>(
  undefined,
)

export interface OhmCompilerContextType {
  compileAndExecute: (query: string) => Promise<CompilationResult>
}

export const OhmCompilerContext = createContext<
  OhmCompilerContextType | undefined
>(undefined)

export const useResult = () => {
  const context = useContext(ResultContext)
  if (!context)
    throw new Error('useResult deve essere usato dentro SandboxProvider')
  return context
}

export const useOhmCompiler = () => {
  const context = useContext(OhmCompilerContext)
  if (!context)
    throw new Error('useOhmCompiler deve essere usato dentro SandboxProvider')
  return context
}

export const IOContext = createContext<IOContextType | undefined>(undefined)
export const useSmsQLIO = () => {
  const context = useContext(IOContext)
  if (!context)
    throw new Error('useSmsQLIO deve essere usato dentro SmsQLIOContext')
  return context
}