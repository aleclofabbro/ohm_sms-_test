import type { ModelDescriptor, EntityDescriptor } from './ohm/types'

export const channelDescriptor: EntityDescriptor = {
  type: 'object',
  idProp: { path: 'id.id' }, // Utilizziamo xmlId come identificatore primitivo primario
  properties: {
    versionableUuid: { type: 'string' },
    versionableVersion: { type: 'string' },
    versionableType: { type: 'string' },
    id: {
      type: 'object',
      properties: { id: { type: 'string' } },
    },
    xmlId: { type: 'string' },
    name: { type: 'string' },
    qualifiedName: {
      type: 'array',
      items: { type: 'string' },
    },
    parentId: {
      type: 'object',
      properties: { id: { type: 'string' } },
    },
    subchannelIds: {
      type: 'array',
      items: {
        type: 'object',
        idProp: { path: 'id' },
        properties: { id: { type: 'string' } },
      },
    },

    // NOTA SUI RIFERIMENTI CICLICI: parent, parentRef, subchannels, subchannelRefs
    // Se il tuo motore supporta i riferimenti (es. type: 'reference'), puoi usarli.
    // Altrimenti vengono mappati come oggetti base senza espansione infinita.
    parentRef: { type: 'object', properties: { id: { type: 'string' } } },
    parent: { type: 'object', properties: { id: { type: 'string' } } },

    subchannelRefs: {
      type: 'array',
      items: {
        type: 'object',
        idProp: { path: 'id' },
        properties: { id: { type: 'string' } },
      },
    },
    subchannels: {
      type: 'array',
      items: {
        type: 'object',
        idProp: { path: 'id' },
        properties: { id: { type: 'string' } },
      },
    },

    type: { type: 'string' },

    travelSolutionProfile: {
      type: 'object',
      // idProp: { name: 'id' },
      properties: {
        versionableUuid: { type: 'string' },
        versionableVersion: { type: 'string' },
        versionableType: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        deleted: { type: 'boolean' },
        id: { type: 'number' },
      },
    },

    navigationProfile: {
      type: 'object',
      properties: { id: { type: 'string' } },
    },
    direction: { type: 'string' },

    tags: {
      type: 'array',
      items: { type: 'number' },
    },
    tagValues: {
      type: 'array',
      items: { type: 'string' },
    },

    locationId: {
      type: 'object',
      properties: { id: { type: 'string' } },
    },

    accountingOfficeId: {
      type: 'object',
      properties: {
        at_type: { type: 'string' },
        accountingOfficeId: { type: 'number' },
        ticketCounterId: { type: 'number' },
      },
    },

    paymentConfigurations: {
      type: 'array',
      items: {
        type: 'object',
        idProp: { path: 'paymentId' },
        properties: {
          enabled: { type: 'boolean' },
          paymentId: { type: 'string' },
        },
      },
    },

    ticketConfigurations: {
      type: 'array',
      items: {
        type: 'object',
        idProp: { path: 'ticketDocumentType' },
        properties: {
          ticketDocumentType: { type: 'string' },
          enabled: { type: 'boolean' },
        },
      },
    },

    enabled: { type: 'boolean' },
    travelSolutionProfileId: { type: 'number' },
    issuerSaleCompanyId: { type: 'string' },

    environments: {
      type: 'array',
      items: { type: 'number' },
    },

    creationTimestamp: { type: 'string' },
    lastUpdateTimestamp: { type: 'string' },
  },
}

const serviceParameterTypeDescriptor: EntityDescriptor = {
  type: 'object',
  idProp: { path: 'id' },
  properties: {
    id: { type: 'number' },
    at_type: { type: 'string' },
    versionableUuid: { type: 'string' },
    versionableVersion: { type: 'string' },
    versionableType: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string' },
    position: { type: 'number' },
    validation: { type: 'boolean' },
    typeDefinition: {
      type: 'object',
      properties: {
        enumeration: {
          type: 'array',
          items: { type: 'string' },
        },
        validationPattern: { type: 'string' },
        inputPattern: { type: 'string' },
        minLength: { type: 'number' },
        maxLength: { type: 'number' },
        minValue: { type: 'number' },
        maxValue: { type: 'number' },
        baseType: { type: 'string' },
        defaultValue: { type: 'string' },
      },
    },
    tpfCode: { type: 'string' },
    nameKey: { type: 'string' },
    hidden: { type: 'boolean' },
  },
}
export const smsModelDescriptor: ModelDescriptor = {
  Channel: channelDescriptor,
  ServiceParameterType: serviceParameterTypeDescriptor,
}
