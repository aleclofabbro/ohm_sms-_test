import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import SandboxApp from './SandboxApp.js'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* <App /> */}
    <SandboxApp/>
  </StrictMode>,
)
