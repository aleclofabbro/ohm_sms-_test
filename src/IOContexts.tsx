// SandboxContexts.tsx
import { createContext, useContext } from 'react';
import type { IO } from './ohm/semantic.types';

export type SmsQLIOContext = {
  io:IO
}
export const SmsQLIOContext = createContext<SmsQLIOContext | undefined>(undefined)
export const useSmsQLIO = () => {
  const context = useContext(SmsQLIOContext);
  if (!context) throw new Error("useSmsQLIO deve essere usato dentro SmsQLIOContext");
  return context;
};