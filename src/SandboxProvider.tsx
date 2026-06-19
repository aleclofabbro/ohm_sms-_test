import React, { type ReactNode, useState } from 'react'
import { useSmsQLIO } from './IOContexts'
import { fetchModel } from './ohm/fetch-required-entities'
import { execQuery } from './ohm/mingo-exec-query'
import type { Model } from './ohm/types'
import {
  type CompilationResult,
  type DiffResult,
  OhmCompilerContext,
  ResultContext,
} from './SandboxContexts'


export const SandboxProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [model, setModel] = useState<Model>({})
  const [queryResult, setQueryResult] = useState<DiffResult | null>(null)
  const smsQLctx = useSmsQLIO()

  const compileAndExecute = (query: string): CompilationResult => {
    fetchModel({ io: smsQLctx.io, query })
      .then(async (fetchedModel) => {
        setModel(fetchedModel)
        const qresult = await execQuery(query, fetchedModel)
        setQueryResult({after: qresult,before: fetchedModel})
        return fetchedModel
      })
      .catch((e) => {
        setModel({})
        setQueryResult(null)
        return { success: false, error: String(e) }
      })

    console.log('Esecuzione query in corso...', query)
    return { success: true }
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
