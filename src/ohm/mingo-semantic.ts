import type { Criteria, Options } from 'mingo/types'
import type { Modifier, PipelineStage, UpdateConfig } from 'mingo/updater'
import grammar from './grammar/grammar.ohm-bundle.js'
import type {
  _any,
  ModelDescriptor,
  SelectedEntities,
} from './types.js'

const mingoSemantics = grammar.createSemantics()

export type CompileQueryResult = {
  selectedEntities: SelectedEntities
  results: CompileQueryEntityResult[]
}

export type EntityOperation = {
  condition: Criteria<_any>
  modifier: Modifier<_any> | PipelineStage[]
  updateConfig?: UpdateConfig
  options?: Partial<Omit<Options, 'context'>>
  operation: string
}

export type CompileQueryArg = {
  query: string
  modelDescriptor: ModelDescriptor
}

export type CompileQueryEntityResult = {
  entityName: string
  idsCondition: Criteria<_any>
  pipeline: EntityOperation[]
}

// Interfaccia interna per il contesto di esecuzione della Semantic Action
type CompileContext = CompileQueryResult & {
  modelDescriptor: ModelDescriptor
  rootEntityName: string | null
  currentPath: string
  arrayFilters: _any[]
  pipeline: EntityOperation[]
}

// Helper per risolvere la property Id camminando sul model descriptor
function getIdPropForPath(
  modelDesc: ModelDescriptor,
  entityName: string | null,
  path: string,
): string | undefined {
  if (!entityName || !modelDesc[entityName]) return undefined

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let currentDesc: any = modelDesc[entityName]
  const parts = path.split('.').filter((p) => p && !p.startsWith('$['))

  for (const part of parts) {
    if (currentDesc?.type === 'object' && currentDesc.props?.[part]) {
      currentDesc = currentDesc.props[part]
    } else if (
      currentDesc?.type === 'array' &&
      currentDesc.elemDescriptor?.props?.[part]
    ) {
      currentDesc = currentDesc.elemDescriptor.props[part]
    } else {
      return undefined // Path non tracciabile
    }
  }

  // Se l'elemento finale è un array, estraiamo l'ID degli elementi contenuti
  if (currentDesc?.type === 'array' && currentDesc.elemDescriptor) {
    return currentDesc.elemDescriptor.idProp?.name
  }
  return currentDesc?.idProp?.name
}

mingoSemantics.addOperation('compile(ctx)', {
  Program(stmtSeq) {
    stmtSeq.compile(this.args.ctx)
  },

  StatementSequence(stmts) {
    stmts.children.forEach((c) => c.compile(this.args.ctx))
  },

  Statement(stmt) {
    stmt.compile(this.args.ctx)
  },
  nl(_cr, _lf) {
    // No-op: i ritorni a capo sono puramente strutturali e non mutano lo stato
  },

  eol(_node) {
    // No-op: fine riga o fine file
  },
  // ------------------------------------
  SelectBlock(
    _kw,
    propPathNode,
    _l,
    idListNode,
    _r,
    _eol1,
    stmtSeq,
    _kwDone,
    _eol2,
  ) {
    const ctx: CompileContext = this.args.ctx
    const targetPath = propPathNode.sourceString
    const ids: never[] = idListNode.compile(ctx)

    // Match dell'EntityName ignorando il case ed un eventuale plurale
    const entityKey = Object.keys(ctx.modelDescriptor).find(
      (k) =>
        k.toLowerCase() === targetPath.toLowerCase() ||
        k.toLowerCase() === targetPath.toLowerCase() + 's' ||
        k.toLowerCase() + 's' === targetPath.toLowerCase(),
    )

    if (entityKey && !ctx.rootEntityName) {
      // ==== ROOT SELECT BLOCK ====
      const idProp = ctx.modelDescriptor[entityKey].idProp.name

      // Registriamo il pre-fetch ID per i layer I/O esterni
      if (!ctx.selectedEntities[entityKey]) {
        ctx.selectedEntities[entityKey] = { ids: [] }
      }
      
      ctx.selectedEntities[entityKey].ids.push(...ids.filter(id=>!ctx.selectedEntities[entityKey].ids.includes(id)))
      

      const rootPipeline: EntityOperation[] = []
      const rootCtx: CompileContext = {
        ...ctx,
        rootEntityName: entityKey,
        currentPath: '',
        arrayFilters: [],
        pipeline: rootPipeline,
      }

      stmtSeq.compile(rootCtx)

      ctx.results.push({
        entityName: entityKey,
        idsCondition: { [idProp]: { $in: ids } },
        pipeline: rootPipeline,
      })
    } else {
      // ==== NESTED SELECT BLOCK ====
      const newPath = ctx.currentPath
        ? `${ctx.currentPath}.${targetPath}`
        : targetPath

      // Puliamo il path da token posizionali precedenti (es: .$[elem]) per cercare l'idProp
      const cleanPath = newPath.replace(/\.\$\[[^\]]+\]/g, '')
      const idProp = getIdPropForPath(
        ctx.modelDescriptor,
        ctx.rootEntityName,
        cleanPath,
      )

      // Creiamo un alias univoco per l'array filter
      const filterAlias = `elem_${targetPath.replace(/[^a-zA-Z0-9]/g, '_')}`
      const fullPath = `${newPath}.$[${filterAlias}]`

      const newArrayFilters = [...ctx.arrayFilters]
      if (idProp) {
        newArrayFilters.push({ [`${filterAlias}.${idProp}`]: { $in: ids } })
      } else {
        newArrayFilters.push({ [filterAlias]: { $in: ids } }) // array primitivi
      }

      const nestedCtx: CompileContext = {
        ...ctx,
        currentPath: fullPath,
        arrayFilters: newArrayFilters,
      }

      stmtSeq.compile(nestedCtx)
    }
  },

  SetStmt(_kw, propPathNode, _eq, jsonValueNode) {
    const ctx: CompileContext = this.args.ctx
    const prop = propPathNode.sourceString
    const val = jsonValueNode.compile(ctx)
    const targetPath = ctx.currentPath ? `${ctx.currentPath}.${prop}` : prop

    ctx.pipeline.push({
      operation: this.sourceString.trim(),
      condition: {},
      modifier: { $set: { [targetPath]: val } },
      updateConfig:
        ctx.arrayFilters.length > 0
          ? { arrayFilters: ctx.arrayFilters }
          : undefined,
    })
  },

  AddStmt(_kw, propPathNode, _eq, jsonValueNode) {
    const ctx: CompileContext = this.args.ctx
    const prop = propPathNode.sourceString
    const val = jsonValueNode.compile(ctx)
    const elements = Array.isArray(val) ? val : [val]
    const targetPath = ctx.currentPath ? `${ctx.currentPath}.${prop}` : prop

    ctx.pipeline.push({
      operation: this.sourceString.trim(),
      condition: {},
      modifier: { $push: { [targetPath]: { $each: elements } } },
      updateConfig:
        ctx.arrayFilters.length > 0
          ? { arrayFilters: ctx.arrayFilters }
          : undefined,
    })
  },

  UpsertStmt(_kw, propPathNode, _eq, jsonValueNode) {
    const ctx: CompileContext = this.args.ctx
    const prop = propPathNode.sourceString
    const val = jsonValueNode.compile(ctx)
    const elements = Array.isArray(val) ? val : [val]
    const targetPath = ctx.currentPath ? `${ctx.currentPath}.${prop}` : prop

    const cleanPath = targetPath.replace(/\.\$\[[^\]]+\]/g, '')
    const idProp = getIdPropForPath(
      ctx.modelDescriptor,
      ctx.rootEntityName,
      cleanPath,
    )

    if (!idProp) {
      // Array di primitive
      ctx.pipeline.push({
        operation: this.sourceString.trim(),
        condition: {},
        modifier: { $addToSet: { [targetPath]: { $each: elements } } },
        updateConfig:
          ctx.arrayFilters.length > 0
            ? { arrayFilters: ctx.arrayFilters }
            : undefined,
      })
      return
    }

    // Array di oggetti: pattern PATCH (atomico per proprietà) + ADD condizionale
    for (const newEl of elements) {
      const elId = newEl[idProp]
      if (elId === undefined) continue // Salta se manca la chiave primaria

      const safeId = String(elId).replace(/[^a-zA-Z0-9]/g, '_')
      const upsertAlias = `upsert_alias_${safeId}`

      // ==== 1. PATCH OP ====
      // Scomponiamo il $set in singole operazioni per ingannare il bug del
      // conflict-detector di Mingo, ignorando la proprietà identificativa stessa.
      for (const [k, v] of Object.entries(newEl)) {
        if (k === idProp) continue

        ctx.pipeline.push({
          operation: `PATCH ${k} part of UPSERT ${elId}`,
          condition: {},
          modifier: { $set: { [`${targetPath}.$[${upsertAlias}].${k}`]: v } },
          updateConfig: {
            arrayFilters: [
              ...ctx.arrayFilters,
              { [`${upsertAlias}.${idProp}`]: elId },
            ],
          },
        })
      }

      // ==== 2. ADD OP ====
      let addCondition = {}
      let addArrayFilters = [...ctx.arrayFilters]

      // Cerchiamo se c'è un alias genitore nella dot-notation
      const aliasRegex = /\$\[([a-zA-Z0-9_]+)\](?!.*\$\[)/
      const match = targetPath.match(aliasRegex)

      if (match) {
        // Target innestato: alteriamo il filtro del genitore
        const parentAlias = match[1]
        const splitParts = targetPath.split(`$[${parentAlias}]`)
        const relativePath = splitParts[1]

        addArrayFilters = addArrayFilters.map((filter) => {
          const isAliasFilter = Object.keys(filter).some(
            (k) => k.startsWith(parentAlias + '.') || k === parentAlias,
          )
          if (isAliasFilter) {
            return {
              ...filter,
              [`${parentAlias}${relativePath}.${idProp}`]: { $ne: elId },
            }
          }
          return filter
        })
      } else {
        // Target radice
        addCondition = { [`${targetPath}.${idProp}`]: { $ne: elId } }
      }

      ctx.pipeline.push({
        operation: `ADD part of UPSERT ${elId}`,
        condition: addCondition,
        modifier: { $push: { [targetPath]: newEl } },
        updateConfig:
          addArrayFilters.length > 0
            ? { arrayFilters: addArrayFilters }
            : undefined,
      })
    }
  },

  RemoveStmt(_kw, propPathNode, _l, idListNode, _r, _eol) {
    const ctx: CompileContext = this.args.ctx
    const prop = propPathNode.sourceString
    const ids = idListNode.compile(ctx)
    const targetPath = ctx.currentPath ? `${ctx.currentPath}.${prop}` : prop

    const cleanPath = targetPath.replace(/\.\$\[[^\]]+\]/g, '')
    const idProp = getIdPropForPath(
      ctx.modelDescriptor,
      ctx.rootEntityName,
      cleanPath,
    )

    // Se è un array di entità tira via l'elemento basato su idProp, sennò controlla il valore diretto
    const pullCondition = idProp ? { [idProp]: { $in: ids } } : { $in: ids }

    ctx.pipeline.push({
      operation: this.sourceString.trim(),
      condition: {},
      modifier: { $pull: { [targetPath]: pullCondition } },
      updateConfig:
        ctx.arrayFilters.length > 0
          ? { arrayFilters: ctx.arrayFilters }
          : undefined,
    })
  },

  IdList(listOf) {
    return listOf.asIteration().children.map((c) => c.compile(this.args.ctx))
  },

  Id(idNode) {
    return idNode.compile(this.args.ctx)
  },

  StringId(_quote1, strNodes, _quote2) {
    return strNodes.sourceString
  },

  IntId(_minus, _digits) {
    return parseInt(this.sourceString, 10)
  },

  PropPath(propName, _dots, propNames) {
    return this.sourceString
  },

  jsonValue(nodes) {
    let str = this.sourceString
    // Pulisce i commenti in-line " //" eventualmente assorbiti dalla regola greedy e parsa il json
    str = str.replace(/\/\/.*/, '').trim()
    return JSON.parse(str)
  },
})

export function compileQuery({
  query,
  modelDescriptor,
}: CompileQueryArg): CompileContext {
  const match = grammar.match(query)

  if (match.failed()) {
    console.error(match)
    throw new Error(`Parse error: ${match.message}`)
  }

  const ctx: CompileContext = {
    modelDescriptor,
    selectedEntities: {},
    results: [],
    rootEntityName: null,
    currentPath: '',
    arrayFilters: [],
    pipeline: [],
  }

  mingoSemantics(match).compile(ctx)
  console.log({ ctx })
  return ctx
}
