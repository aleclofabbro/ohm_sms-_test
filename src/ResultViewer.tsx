import { DiffEditor } from '@monaco-editor/react'
import React, { useReducer } from 'react'
import { VirtualDiffViewer } from 'virtual-react-json-diff'
import { useResult } from './SandboxContexts'

export const ResultViewer: React.FC = () => {
  const { queryResult } = useResult()
  const [viewType, toggleViewType] = useReducer(
    (prev) =>
      prev === 'virtualDiffViewer' ? 'monacoDiffEditor' : 'virtualDiffViewer',
    'monacoDiffEditor',
  )

  return (
    <div className="panel">
      <div className="panel-header">
        State & Diff Viewer{' - '}
        <button
          style={{
            background: 'transparent',
            color: 'inherit',
          }}
          onClick={toggleViewType}
        >
          set{' '}
          {viewType === 'virtualDiffViewer'
            ? 'monacoDiffEditor'
            : 'virtualDiffViewer'}
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
            <h4 style={{ margin: '0 0 12px 0', color: '#4CAF50' }}>
              Risultato Query (Diff): {viewType}
            </h4>

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
                    original={JSON.stringify(queryResult.before, null, 2)}
                    modified={JSON.stringify(queryResult.after, null, 2)}
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
                    oldValue={queryResult.before}
                    newValue={queryResult.after}
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
