import React, { type ReactNode, useState } from 'react'
import { useSmsQLIO } from './IOContexts'
import type { Model } from './ohm/types'
import {
  type CompilationResult,
  type DiffResult,
  OhmCompilerContext,
  ResultContext
} from './SandboxContexts'
import { smsModelDescriptor } from './sms-model-descriptor'
import { executeQuery } from './ohm/exec-query'
import { radashiCommandEngine } from './ohm/radashi-engine'

export const SandboxProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [model, setModel] = useState<Model>({})
  const [queryResult, setQueryResult] = useState<DiffResult | null>(null)
  const smsQLctx = useSmsQLIO()

  const compileAndExecute = (query: string): Promise<CompilationResult> => {
    console.log('Esecuzione query in corso...', query)
    return executeQuery({
      query,
      io: smsQLctx.io,
      modelDescriptor: smsModelDescriptor,
      engine: radashiCommandEngine,
    })
      .then<CompilationResult>((qresult) => {
        setModel(qresult.model.before)
        setQueryResult({
          after: qresult.model.after,
          before: qresult.model.before,
        })
        return { success: true }
      })
      .catch<CompilationResult>((e) => {
        setModel({})
        setQueryResult(null)
        // throw e
        return { success: false, error: e }
      })
  }

  return (
    <OhmCompilerContext.Provider value={{ compileAndExecute }}>
      <ResultContext.Provider
        value={{ model, setModel, queryResult, setQueryResult }}
      >
        {children}
      </ResultContext.Provider>
    </OhmCompilerContext.Provider>
  )
}
