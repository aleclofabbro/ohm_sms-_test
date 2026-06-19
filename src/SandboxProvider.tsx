import React, { type ReactNode, useState } from 'react'
import { useSmsQLIO } from './IOContexts'
import { execQuery } from './ohm/mingo-exec-query'
import type { Model } from './ohm/types'
import {
  type CompilationResult,
  type DiffResult,
  OhmCompilerContext,
  ResultContext
} from './SandboxContexts'
import { smsModelDescriptor } from './sms-model-descriptor'

export const SandboxProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [model, setModel] = useState<Model>({})
  const [queryResult, setQueryResult] = useState<DiffResult | null>(null)
  const smsQLctx = useSmsQLIO()

  const compileAndExecute = async (query: string): Promise<CompilationResult>  => {
    execQuery({ query, io: smsQLctx.io, modelDescriptor:smsModelDescriptor })
      .then((qresult) => {
        const fetchedModel = qresult.requireModelResult.model

        setModel(fetchedModel)
        setQueryResult({ after: qresult.updatedModel, before: fetchedModel })
        return fetchedModel
      })
      .catch((e) => {
        setModel({})
        setQueryResult(null)
        // throw e
        return { success: false, error: String(e) }
      })

    console.log('Esecuzione query in corso...', query)
    return { success: true}
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
