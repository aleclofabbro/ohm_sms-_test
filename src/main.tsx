import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import SandboxApp from './SandboxApp.js'
import { SmsQLIOContext } from './IOContexts.js'
import type { AnyObject } from 'mingo/types'

const smsQLIOContext: SmsQLIOContext = {
  io: {
    async requireModel({ ids, name }) {
      const entities = (
        await Promise.all(
          ids.map((id) =>
            fetch(`/_/${name}/${id}`).then((resp) => resp.json()),
          ),
        )
      )
      .filter((_): _ is AnyObject => typeof _ === 'object')
      return {
        entities: entities,
      }
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
