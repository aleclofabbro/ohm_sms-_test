import Editor, { useMonaco, type OnMount } from '@monaco-editor/react' // Richiede npm install @monaco-editor/react
import React, { useState } from 'react'
import { useOhmCompiler } from './SandboxContexts'

// const defaultQuery = `
// SELECT Channel(215917,210527,215042,215933,210543)
//   SET enabled = true
// DONE
// `
const defaultQuery = `
SELECT Channel(215917,210527,215042,215933,210543)
  SET enabled = true
  ADD paymentConfigurations = [{ "paymentId": "PAYPAL", "enabled": true }, { "paymentId": "MYPAY", "enabled": false } ]
  UPSERT ticketConfigurations = [{ "ticketDocumentType": "K3_VALUE", "enabled": false }]
  
  SELECT ticketConfigurations("K3_VALUE")
    SET enabled = false
  DONE
  
  REMOVE tagValues("PLUS")
  REMOVE tagValues("K3_VALUE")
  ADD tagValues = ["XXXXXXX"]
DONE

SELECT Channel(215917, 215042)
  SET accountingOfficeId.accountingOfficeId = 11111111
DONE

SELECT ServiceParameterType(311)
  REMOVE typeDefinition.enumeration("ACQUASPARTA CENTRO (E620 Terni-Perugia)")
DONE
`
export const QueryEditor: React.FC = () => {
  const { compileAndExecute } = useOhmCompiler()
  const [query, setQuery] = useState(defaultQuery)
  //const { model } = useResult();
  const handleRun = async (query: string) => {
    const result = await compileAndExecute(query /* , model */)
    if (!result.success) {
      console.error(result)
    }
  }
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editor.addAction({
      id: 'submit-code',
      label: 'Submit Query',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: (ed) => {
        const query = ed.getValue()
        handleRun(query)
      },
    })
  }
  return (
    <div className="panel">
      <div
        className="panel-header"
        style={{ display: 'flex', justifyContent: 'space-between' }}
      >
        <span>Query Editor</span>
        <button onClick={() => handleRun(query)} style={{ cursor: 'pointer' }}>
          Esegui Query ▶
        </button>
      </div>
      <div className="panel-content">
        <Editor
          height="100%"
          // defaultLanguage="sql"
          theme="vs-dark"
          value={query}
          onChange={(query) => setQuery(query ?? '')}
          options={{ minimap: { enabled: false }, fontSize: 14 }}
          onMount={handleEditorDidMount}
        />
      </div>
    </div>
  )
}
