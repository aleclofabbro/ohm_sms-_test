import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import SandboxApp from './SandboxApp.js'
import { SmsQLIOContext } from './IOContexts.js'
import type { AnyObject } from 'mingo/types'

const smsQLIOContext: SmsQLIOContext = {
  io: {
    async requireModel({ selectedEntities }) {
      const entityEntries = await Promise.all(
        Object.entries(selectedEntities).map(async ([entityName, selected]) => {
          const collection = (
            await Promise.all(
              selected.ids.map((id) =>
                fetch(`/_/${entityName}/${id}`).then((resp) => resp.json()),
              ),
            )
          ).filter((_): _ is AnyObject => typeof _ === 'object')
          return [entityName, collection] as const
        }),
      )
      return { model: Object.fromEntries(entityEntries) }
    },
  },
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SmsQLIOContext value={smsQLIOContext}>
      {/* <App /> */}
      <SandboxApp />
    </SmsQLIOContext>
  </StrictMode>,
)
