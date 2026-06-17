// SandboxContexts.tsx
import type { AnyObject } from 'mingo/types';
import { createContext, useContext } from 'react';

// --- TIPI ---
export type CompilationResult = {
  success: true;
  error?: undefined;
}|{
  success: true;
  error: string;
}

export interface DiffResult {
  before: AnyObject;
  after: AnyObject;
}

// --- CONTESTO DEI RISULTATI ---
interface ResultContextType {
  targetData: AnyObject;
  setTargetData: (data: AnyObject) => void;
  queryResult: DiffResult | null;
  setQueryResult: (result: DiffResult | null) => void;
}

export const ResultContext = createContext<ResultContextType | undefined>(undefined);

// --- CONTESTO DI COMPILAZIONE OHM ---
interface OhmCompilerContextType {
  compileAndExecute: (query: string, currentData: AnyObject) => CompilationResult;
}

export const OhmCompilerContext = createContext<OhmCompilerContextType | undefined>(undefined);

// --- HOOKS CUSTOM ---
export const useResult = () => {
  const context = useContext(ResultContext);
  if (!context) throw new Error("useResult deve essere usato dentro SandboxProvider");
  return context;
};

export const useOhmCompiler = () => {
  const context = useContext(OhmCompilerContext);
  if (!context) throw new Error("useOhmCompiler deve essere usato dentro SandboxProvider");
  return context;
};