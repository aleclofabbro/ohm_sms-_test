// QueryEditor.tsx
import React, { useState } from 'react';
import Editor from '@monaco-editor/react'; // Richiede npm install @monaco-editor/react
import { useOhmCompiler, useResult } from './SandboxContexts';

export const QueryEditor: React.FC = () => {
  const [code, setCode] = useState<string>("/* Scrivi la tua query Custom Entity qui */\n\nON Order(order_999)\n  SET status: \"shipped\"");
  const { compileAndExecute } = useOhmCompiler();
  const { targetData } = useResult();

  const handleRun = () => {
    // Esegue la compilazione tramite il context
    const result = compileAndExecute(code, targetData);
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
          value={code}
          onChange={(value) => setCode(value || "")}
          options={{ minimap: { enabled: false }, fontSize: 14 }}
        />
      </div>
    </div>
  );
};