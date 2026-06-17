import React from 'react';
import { useResult } from './SandboxContexts';
import { VirtualDiffViewer } from 'virtual-react-json-diff'; 

export const ResultViewer: React.FC = () => {
  const { targetData, queryResult } = useResult();

  return (
    <div className="panel">
      <div className="panel-header">State & Diff Viewer</div>
      {/* Manteniamo il display flex ma senza altezze percentuali ambigue */}
      <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', padding: '16px', boxSizing: 'border-box' }}>
        
        {queryResult ? (
          <>
            <h4 style={{ margin: '0 0 12px 0', color: '#4CAF50' }}>Risultato Query (Diff):</h4>
            
            {/* 1. flexGrow: 1 prende lo spazio, position: relative fa da ancora */}
            {/* 2. textAlign: 'left' forza il ripristino dell'allineamento testo */}
            <div style={{ flexGrow: 1, position: 'relative', textAlign: 'left', backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '4px' }}>
              
              {/* 3. position: absolute costringe la libreria a stare nei limiti senza espandere il padre */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'auto' }}>
                <VirtualDiffViewer
                  oldValue={queryResult.before}
                  newValue={queryResult.after}
                  height={600}
                  showLineCount
                  showObjectCountStats
                  showSingleMinimap
                />
              </div>
              
            </div>
          </>
        ) : (
          <>
            <h4 style={{ margin: '0 0 12px 0', color: '#2196F3' }}>Stato Iniziale (Mock):</h4>
            <div style={{ flexGrow: 1, position: 'relative', textAlign: 'left', backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '4px' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'auto', padding: '12px' }}>
                <pre style={{ margin: 0, fontFamily: 'monospace' }}>
                  {JSON.stringify(targetData, null, 2)}
                </pre>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};