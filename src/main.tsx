import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import SandboxApp from './SandboxApp.js'
import MonacoSandbox from './sb/MonacoSandbox.js'
import { map } from 'radashi'
import { IOContext, type IOContextType } from './SandboxContexts.js'

const ioContext: IOContextType = {
  io: {
    async requireModel({ requiredModel }) {
      const model = Object.fromEntries(
        await Promise.all(
          Object.entries(requiredModel).map(async ([entityName, entityIds]) => {
            const entities = await map(entityIds, async (id) => {
              const resp = await fetch(`/_/${entityName}/${id}`)
              const entity = await resp.json()
              return entity
            })
            return [entityName, entities]
          }),
        ),
      )

      //.filter((_): _ is AnyObject => typeof _ === 'object')

      return { model }
    },
  },
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <IOContext value={ioContext}>
      {/* <App /> */}
      {location.pathname === '/m' ? <MonacoSandbox /> : <SandboxApp />}
    </IOContext>
  </StrictMode>,
)
