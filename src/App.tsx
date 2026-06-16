import ReactJsonView from '@microlink/react-json-view'
import type { MatchResult } from 'ohm-js'
import { useEffect, useReducer, useState } from 'react'
import { useDebounceCallback } from 'usehooks-ts'
import grammar from './ohm/grammar/grammar.ohm-bundle'

function App() {
  const [json, setJson] = useState<unknown>()
  useEffect(()=>{
    fetch('assets/entities/Sale/Channel/Channel/Channel_1.json')
    .then(_=>_.text())
    .then(_=>JSON.parse(_))
    .then(setJson)
  },[])  
  const [state, d] = useReducer(...stateReducer())
  const onTypedQuery = useDebounceCallback(
    (query: string) => d({ $: 'query', query }),
    200,
    {},
  )

  return (
    <>
      <input
        type="checkbox"
        onChange={({ target: { checked } }) =>
          d({ $: 'append', append: checked })
        }
      />
      <pre>{JSON.stringify(json, null, 2)}</pre>
      <br />
      <textarea
        onChange={({ target: { value } }) => onTypedQuery(value)}
        cols={80}
        rows={10}
      />
      <br />
      {state.results.map((result) => (
        <>
        succeeded: {`${result.succeeded()}`}
        <br/>
        <ReactJsonView src={result} />
        <br/>
        </>
      ))}
    </>
  )
}
type State = {
  query: string
  results: MatchResult[]
  append: boolean
}
type Action = {
  [k in keyof ActionMap]: ActionMap[k] & { $: k }
}[keyof ActionMap]
type ActionMap = {
  query: { query: string }
  // 'result': { result: string}
  clear: unknown
  append: { append: boolean }
}
function stateReducer(): Parameters<typeof useReducer<State, [Action]>> {
  return [
    (prev, action) => {
      switch (action.$) {
        case 'query': {
          const item = grammar.match(action.query)
          return {
            ...prev,
            query: action.query,
            results: prev.append ? [ item, ...prev.results ] : [ item ],
          }
        }
        case 'append':
          return { ...prev, append: action.append }
        // case 'result':
        //   return {...prev, results:[action.result, ...prev.results] }
        case 'clear':
          return { ...prev, results: [] }
      }
    },
    { query: '', results: [], append: false },
  ]
}
export default App
