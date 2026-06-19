import type { AnyObject } from 'mingo/types';
import { createContext, useContext } from 'react';
import type { Model } from './ohm/types';

export type CompilationResult = {
  success: true;
  error?: undefined;
}|{
  success: false;
  error: string;
}

export interface DiffResult {
  before: AnyObject;
  after: AnyObject;
}

interface ResultContextType {
  model: Model;
  setModel: (data: Model) => void;
  queryResult: DiffResult | null;
  setQueryResult: (result: DiffResult | null) => void;
}

export const ResultContext = createContext<ResultContextType | undefined>(undefined);

interface OhmCompilerContextType {
  compileAndExecute: (query: string, currentData: AnyObject) => CompilationResult;
}

export const OhmCompilerContext = createContext<OhmCompilerContextType | undefined>(undefined);

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