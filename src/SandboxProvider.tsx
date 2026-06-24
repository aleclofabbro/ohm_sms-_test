import React, { type ReactNode, useState } from 'react'
import type { Model } from './ohm/types'
import {
  type CompilationResult,
  type DiffResult,
  OhmCompilerContext,
  type OhmCompilerContextType,
  ResultContext,
  useSmsQLIO,
} from './SandboxContexts'
import { smsModelDescriptor } from './sms-model-descriptor'
import { executeQuery } from './ohm/exec-query'
import { radashiCommandEngine } from './ohm/radashi-engine'
import { tryit } from 'radashi'

export const SandboxProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [model, setModel] = useState<Model>({})
  const [queryResult, setQueryResult] = useState<DiffResult | null>(null)
  const smsQLctx = useSmsQLIO()

  const compileAndExecute: OhmCompilerContextType['compileAndExecute'] = async (
    query: string,
  ): Promise<CompilationResult> => {
    const [error, result] = await tryit(executeQuery)({
      query,
      io: smsQLctx.io,
      modelDescriptor: smsModelDescriptor,
      engine: radashiCommandEngine,
    })

    if (error) {
      setModel({})
      setQueryResult(null)
      // throw error ?
      return { success: false, error }
    }

    setModel(result.model.before)
    setQueryResult({
      after: result.model.after,
      before: result.model.before,
    })

    return { success: true, result }
  }

  return (
    <OhmCompilerContext value={{ compileAndExecute }}>
      <ResultContext value={{ model, setModel, queryResult }}>
        {children}
      </ResultContext>
    </OhmCompilerContext>
  )
}
