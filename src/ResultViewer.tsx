import { DiffEditor } from '@monaco-editor/react'
import React, { useMemo, useReducer } from 'react'
import { VirtualDiffViewer } from 'virtual-react-json-diff'
import { useResult } from './SandboxContexts'

export const ResultViewer: React.FC = () => {
  const { queryResult } = useResult()
  const [viewType, toggleViewType] = useReducer(
    (prev) =>
      prev === 'virtualDiffViewer' ? 'monacoDiffEditor' : 'virtualDiffViewer',
    'virtualDiffViewer',
  )

  const results = useMemo(
    () =>
      queryResult
        ? {
            before: JSON.stringify(queryResult.before, null, 2),
            after: JSON.stringify(queryResult.after, null, 2),
          }
        : { after: '', before: '' },
    [queryResult],
  )
  return (
    <div className="panel">
      <div className="panel-header">
        Risultato Query (Diff) using:
        <button
          style={{
            background: 'transparent',
            color: 'inherit',
            cursor: 'pointer',
          }}
          onClick={toggleViewType}
        >
          {viewType}
        </button>
      </div>
      <div
        className="panel-content"
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '16px',
          boxSizing: 'border-box',
        }}
      >
        {queryResult && (
          <>
            <div
              style={{
                flexGrow: 1,
                position: 'relative',
                textAlign: 'left',
                backgroundColor: '#1e1e1e',
                border: '1px solid #333',
                borderRadius: '4px',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  overflow: 'auto',
                }}
              >
                {viewType === 'monacoDiffEditor' ? (
                  <DiffEditor
                    height="100%"
                    language="json"
                    // theme="vs-dark"
                    original={results.before}
                    modified={results.after}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      renderSideBySide: true, // Mostra i pannelli affiancati
                      wordWrap: 'on',
                      scrollBeyondLastLine: false,
                    }}
                  />
                ) : (
                  <VirtualDiffViewer
                    oldValue={JSON.parse(results.before)}
                    newValue={JSON.parse(results.after)}
                    height={600}
                    showLineCount
                    showObjectCountStats
                    showSingleMinimap
                  />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
