// QueryEditor.tsx
import Editor, { type OnMount } from '@monaco-editor/react'; // Richiede npm install @monaco-editor/react
import React, { useState } from 'react';
import { useOhmCompiler, useResult } from './SandboxContexts';

export const QueryEditor: React.FC = () => {
  const [query, setQuery] = useState<string>(`
ON Channel(102052,808,100411,100454,100646,100786,100941,101740,101932)
  SET enabled: true
  ADD paymentConfigurations [{ "enabled": true, "paymentId": "PAYPAL" }]
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
    // Esegue la compilazione tramite il context
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
          // defaultLanguage="sql" // Puoi definire un linguaggio custom per monaco in futuro
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