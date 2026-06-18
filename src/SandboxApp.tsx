import React from 'react';
import './Sandbox.css';
import { SandboxProvider } from './SandboxProvider';
import { QueryEditor } from './QueryEditor';
import { ResultViewer } from './ResultViewer';

export const SandboxApp: React.FC = () => {
  return (
    <SandboxProvider>
      <div className="sandbox-container">
        <header className="sandbox-header">
          <h2>SMSQL+ Sandbox</h2>
        </header>
        
        <QueryEditor />
        <ResultViewer />
        
      </div>
    </SandboxProvider>
  );
};

export default SandboxApp;