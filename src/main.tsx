import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import SandboxApp from './SandboxApp.js'
import { SmsQLIOContext } from './IOContexts.js'
import type { AnyObject } from 'mingo/types'

const smsQLIOContext: SmsQLIOContext = {
  io: {
    async fetchEntitiesById({ ids, name }) {
      const entities = (
        await Promise.all(
          ids.map((id) =>
            fetch(`/_/${name}/${id}`).then((resp) => resp.json()),
          ),
        )
      )
      .filter((_): _ is AnyObject => typeof _ === 'object')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map(_ => ({..._, id:(_ as any).id.id}))
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
