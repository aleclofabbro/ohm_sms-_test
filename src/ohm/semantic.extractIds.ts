import grammar from './grammar/grammar.ohm-bundle'
import type { ModelIds } from './semantic.types'


const extractEntitiesIdsSemantics = grammar.createSemantics()

  extractEntitiesIdsSemantics.addOperation<ModelIds>(
    'extractEntitiesIds()',
    {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      Query(targetNode, _statementsNode) {
        return targetNode.extractEntitiesIds()
      },

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      Target(_on, ident, _lparen, ids, _rparen) {
        const entityName = ident.sourceString
        const targetIds = ids.sourceString.split(',')

        return {
          [entityName]: targetIds,
        }
      },

      // NestedBlock(targetNode, statementsNode, _up) {},
      // Statement_SetOp(op) {},
      // Statement_AddOp(op) {},
      // Statement_UpsertOp(op) {},
      // Statement_RemoveOp(op) {},
      // Statement_NestedBlock(op) {},
      // SetOp(_set, path, _colon, jsonMock) {},
      // AddOp(_add, ident, jsonMock) {},
      // UpsertOp(_upsert, ident, jsonMock) {},
      // RemoveOp(_remove, ident, _lparen, ids, _rparen) {},
    },
  )

export function extractEntitiesIds(query: string) {
  const match = grammar.match(query)

  if (match.failed()) {
    throw new Error(`Syntax Error in Query:\\n${match.message}`)
  }

  const result = extractEntitiesIdsSemantics(match)
    .extractEntitiesIds() as ModelIds
  return result
}
