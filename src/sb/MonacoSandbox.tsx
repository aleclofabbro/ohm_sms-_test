import { Editor, useMonaco, type OnMount } from '@monaco-editor/react'
import React, { useEffect, useState } from 'react'
import '../Sandbox.css'

export const MonacoSandbox: React.FC = () => {
  const [query, setQuery] = useState('')
  const handleEditorDidMount: OnMount = ( editor, monaco ) => {
    monaco
    editor
  }
    const monaco = useMonaco();

  useEffect(() => {
    // do conditional chaining
    //monaco?.languages.typescript.javascriptDefaults.setEagerModelSync(true);
    // or make sure that it exists by other ways
    if (monaco) {
      //  monaco.editor
      console.log('monaco instance:', monaco)
    }
  }, [monaco])
  return (
    <div className="sandbox-container">
      <header className="sandbox-header"></header>
      <div className="panel">
        <div
          className="panel-header"
          style={{ display: 'flex', justifyContent: 'space-between' }}
        >
          <span>Query Editor</span>
        </div>
        <div className="panel-content">
          <Editor
            height="100%"
            // defaultLanguage=""
            // theme="vs-dark"
            defaultValue={query}
            onChange={(value) => {
              console.log(value)
              setQuery(value || '')
            }}
            options={{ minimap: { enabled: false }, fontSize: 14 }}
            onMount={handleEditorDidMount}
          />
        </div>
      </div>
      <div className="panel"></div>
    </div>
  )
}

export default MonacoSandbox
