import React, { type ReactNode, useContext, useState } from 'react';
import { type DiffResult, type CompilationResult, OhmCompilerContext, ResultContext } from './SandboxContexts';
import type { AnyObject } from 'mingo/types';
import { extractEntitiesIds } from './ohm/semantic.extractIds';
import { SmsQLIOContext, useSmsQLIO } from './IOContexts';

// --- PROVIDER COMPLETO ---

export const SandboxProvider: React.FC<{ children: ReactNode; }> = ({ children }) => {
  const [targetData, setTargetData] = useState<AnyObject>({
    // Dati mock iniziali basati sul tuo specs
    Order: {
      order_999: { status: "pending", delivery: { address: { zip: "00000" } }, history: [], items: {}, promoCodes: ["summer_sale"] }
    }
  });
  const [queryResult, setQueryResult] = useState<DiffResult | null>(null);
  const smsQLctx = useSmsQLIO();

  // Stub della funzione di compilazione che implementerai tu
  const compileAndExecute = (query: string): CompilationResult => {
    const entityIds = extractEntitiesIds(query)
    
      smsQLctx.io.fetchEntityByIds()
    entityIds
    console.log("Esecuzione query in corso...", query);
    // TODO: Implementare il parsing OHM.js qui
    return { success: true };
  };

  return (
    <OhmCompilerContext.Provider value={{ compileAndExecute }}>
      <ResultContext.Provider value={{ targetData, setTargetData, queryResult, setQueryResult }}>
        {children}
      </ResultContext.Provider>
    </OhmCompilerContext.Provider>
  );
};
