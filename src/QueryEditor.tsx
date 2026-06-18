import Editor, { type OnMount } from '@monaco-editor/react'; // Richiede npm install @monaco-editor/react
import React, { useState } from 'react';
import { useOhmCompiler, useResult } from './SandboxContexts';

export const QueryEditor: React.FC = () => {
  const [query, setQuery] = useState<string>(`
ON Channel(215917,210527,215042,215933,210543)
  SET enabled: true
  ADD paymentConfigurations [{ "id": "PAYPAL", "enabled": true }, { "id": "MYPAY", "enabled": false } ]
  UPSERT ticketConfigurations [{ "id": "PDF", "enabled": false }]
  ON ticketConfigurations(K3_VALUE)
    SET enabled: false
  UP
  REMOVE tagValues(NOPOS)
  REMOVE tagValues(K3_VALUE)
`.trim());
  const { compileAndExecute } = useOhmCompiler();
  const { model } = useResult();
  const handleEditorDidMount:OnMount = (editor, monaco) => {
    // Add the keybinding action
    editor.addAction({
      id: 'submit-code',
      label: 'Submit Query',
      keybindings: [ monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter ],
      run: (ed) => {
        const query = ed.getValue();
        compileAndExecute(query,model)
        // Add your custom logic here (e.g., submit form, run code)
      },
    });
  };
  const handleRun = () => {
    const result = compileAndExecute(query, model);
    if (!result.success) {
      console.error(result.error);
    }
  };

  return (
    <div className="panel">
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Query Editor</span>
        <button onClick={handleRun} style={{ cursor: 'pointer' }}>Esegui Query ▶</button>
      </div>
      <div className="panel-content">
        <Editor
          height="100%"
          // defaultLanguage="sql"
          theme="vs-dark"
          value={query}
          onChange={(value) => setQuery(value || "")}
          options={{ minimap: { enabled: false }, fontSize: 14 }}
          onMount={handleEditorDidMount}
        />
      </div>
    </div>
  );
};