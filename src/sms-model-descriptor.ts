import type { ModelDescriptor, EntityDescriptor } from './ohm/types'

export const channelDescriptor: EntityDescriptor = {
  type: 'object',
  idProp: { name: 'id.id' }, // Utilizziamo xmlId come identificatore primitivo primario
  props: {
    versionableUuid: { type: 'string' },
    versionableVersion: { type: 'string' },
    versionableType: { type: 'string' },
    id: {
      type: 'object',
      props: { id: { type: 'string' } },
    },
    xmlId: { type: 'string' },
    name: { type: 'string' },
    qualifiedName: {
      type: 'array',
      elemDescriptor: { type: 'string' },
    },
    parentId: {
      type: 'object',
      props: { id: { type: 'string' } },
    },
    subchannelIds: {
      type: 'array',
      elemDescriptor: {
        type: 'object',
        idProp: { name: 'id' },
        props: { id: { type: 'string' } },
      },
    },

    // NOTA SUI RIFERIMENTI CICLICI: parent, parentRef, subchannels, subchannelRefs
    // Se il tuo motore supporta i riferimenti (es. type: 'reference'), puoi usarli.
    // Altrimenti vengono mappati come oggetti base senza espansione infinita.
    parentRef: { type: 'object', props: { id: { type: 'string' } } },
    parent: { type: 'object', props: { id: { type: 'string' } } },

    subchannelRefs: {
      type: 'array',
      elemDescriptor: {
        type: 'object',
        idProp: { name: 'id' },
        props: { id: { type: 'string' } },
      },
    },
    subchannels: {
      type: 'array',
      elemDescriptor: {
        type: 'object',
        idProp: { name: 'id' },
        props: { id: { type: 'string' } },
      },
    },

    type: { type: 'string' },

    travelSolutionProfile: {
      type: 'object',
      // idProp: { name: 'id' },
      props: {
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
      props: { id: { type: 'string' } },
    },
    direction: { type: 'string' },

    tags: {
      type: 'array',
      elemDescriptor: { type: 'number' },
    },
    tagValues: {
      type: 'array',
      elemDescriptor: { type: 'string' },
    },

    locationId: {
      type: 'object',
      props: { id: { type: 'string' } },
    },

    accountingOfficeId: {
      type: 'object',
      props: {
        at_type: { type: 'string' },
        accountingOfficeId: { type: 'number' },
        ticketCounterId: { type: 'number' },
      },
    },

    paymentConfigurations: {
      type: 'array',
      elemDescriptor: {
        type: 'object',
        idProp: { name: 'paymentId' },
        props: {
          enabled: { type: 'boolean' },
          paymentId: { type: 'string' },
        },
      },
    },

    ticketConfigurations: {
      type: 'array',
      elemDescriptor: {
        type: 'object',
        idProp: { name: 'ticketDocumentType' },
        props: {
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
      elemDescriptor: { type: 'number' },
    },

    creationTimestamp: { type: 'string' },
    lastUpdateTimestamp: { type: 'string' },
  },
}

const serviceParameterTypeDescriptor: EntityDescriptor = {
  type: 'object',
  idProp:{name:'id'},
  props: {
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
      props: {
        enumeration: {
          type: 'array',
          elemDescriptor: { type: 'string' },
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
