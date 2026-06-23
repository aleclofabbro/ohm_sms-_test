import { executeQuery } from '../exec-query'
import { radashiCommandEngine } from '../radashi-engine'
import { ModelDescriptor } from '../types'

// ==========================================
// TIPI BASE (Strict, no optional, max 2 livelli)
// ==========================================
export type User = {
  userId: string
  status: string
  priority: number
  metadata: {
    source: string
    verified: boolean
  }
}

export type System = {
  sysId: number
  config: {
    timeout: number
  }
  setup_mode: boolean
}

export type Employee = {
  empId: string
  role: string
}

export type Department = {
  depId: number
  name: string
  budget: number
  active: boolean
  employees: Employee[]
}

export type Organization = {
  orgId: string
  departments: Department[]
  tags: string[]
}

export type WeirdFormat = {
  wfId: string
  spacedProp: string
  data: number[]
}

// Struttura Globale del Model
export type MockModel = {
  users: User[]
  systems: System[]
  organizations: Organization[]
  weirdFormats: WeirdFormat[]
}

// ==========================================
// MODEL DESCRIPTOR
// ==========================================
const modelDescriptor: ModelDescriptor = {
  users: {
    type: 'object',
    idProp: { path: 'userId' },
    properties: {
      userId: { type: 'string' },
      status: { type: 'string' },
      priority: { type: 'number' },
      metadata: {
        type: 'object',
        properties: {
          source: { type: 'string' },
          verified: { type: 'boolean' },
        },
      },
    },
  },
  systems: {
    type: 'object',
    idProp: { path: 'sysId' },
    properties: {
      sysId: { type: 'number' },
      config: {
        type: 'object',
        properties: {
          timeout: { type: 'number' },
        },
      },
      setup_mode: { type: 'boolean' },
    },
  },
  organizations: {
    type: 'object',
    idProp: { path: 'orgId' },
    properties: {
      orgId: { type: 'string' },
      departments: {
        type: 'array',
        items: {
          type: 'object',
          idProp: { path: 'depId' },
          properties: {
            depId: { type: 'number' },
            name: { type: 'string' },
            budget: { type: 'number' },
            active: { type: 'boolean' },
            employees: {
              type: 'array',
              items: {
                type: 'object',
                idProp: { path: 'empId' },
                properties: {
                  empId: { type: 'string' },
                  role: { type: 'string' },
                },
              },
            },
          },
        },
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
      },
    },
  },
  weirdFormats: {
    type: 'object',
    idProp: { path: 'wfId' },
    properties: {
      wfId: { type: 'string' },
      spacedProp: { type: 'string' },
      data: {
        type: 'array',
        items: { type: 'number' },
      },
    },
  },
}

// ==========================================
// TEST QUERY
// ==========================================
const query = `
// TEST 1
SELECT users("user_1", "user_2")
  SET status = "active"
  set priority = 1
  Set metadata = {"source": "web", "verified": true}
DONE

// TEST 2
SELECT systems(100)
  SET config.timeout = 5000
  SET setup_mode = false
DONE

// TEST 3
SELECT organizations("org_A")
  // Inseriamo oggetti completi per supportare i strict types
  ADD departments = [{"depId": 1, "name": "Sales", "budget": 0, "active": false, "employees": []}, {"depId": 3, "name": "IT", "budget": 0, "active": false, "employees": []}]
  UPSERT tags = ["enterprise", "premium"]
  
  SELECT departments(1, 2)
    SET budget = 150000
    SET active = true
    ADD employees = [{"empId": "emp_99", "role": "manager"}]
  DONE 
  
  REMOVE tags("premium")
DONE

// TEST 4
sElEcT   weirdFormats  (  "xyz"  ,   "999"  )
	SET    spacedProp    =    "value"     // commento a fine riga assorbito da jsonValue
  UPSERT   data=[1, 2, 3]
  REMOVE   data(2)
donE
`

// ==========================================
// TEST RUNNER
// ==========================================
test('global test', async () => {
  const execQueryRadashiResult = await executeQuery({
    io: {
      async requireModel(/* { ids } */) {
        return {
          model: initialModel,
        }
      },
    },
    modelDescriptor,
    query,
    engine: radashiCommandEngine,
  })
  // console.log(inspect(execQueryRadashiResult, { depth: 10, colors: true }))
  expect(execQueryRadashiResult.model.after).toEqual(expectedModel)
})

// ==========================================
// MOCK DATA: INITIAL
// ==========================================
export const initialModel: MockModel = {
  users: [
    {
      userId: 'user_1',
      status: 'inactive',
      priority: 1,
      metadata: { source: 'web', verified: true },
    },
    {
      userId: 'user_2',
      status: 'pending',
      priority: 2,
      metadata: { source: 'app', verified: false },
    },
  ],
  systems: [
    {
      sysId: 100,
      config: { timeout: 1000 },
      setup_mode: true,
    },
  ],
  organizations: [
    {
      orgId: 'org_A',
      tags: ['startup', 'premium'],
      departments: [
        {
          depId: 2,
          name: 'Marketing',
          budget: 50000,
          active: false,
          employees: [],
        },
      ],
    },
  ],
  weirdFormats: [
    {
      wfId: 'xyz',
      spacedProp: 'old_value',
      data: [1, 2],
    },
    {
      wfId: '999',
      spacedProp: '',
      data: [10, 20, 30],
    },
  ],
}

// ==========================================
// MOCK DATA: EXPECTED
// ==========================================
export const expectedModel: MockModel = {
  users: [
    {
      userId: 'user_1',
      status: 'active',
      priority: 1,
      metadata: { source: 'web', verified: true },
    },
    {
      userId: 'user_2',
      status: 'active',
      priority: 1,
      metadata: { source: 'web', verified: true },
    },
  ],
  systems: [
    {
      sysId: 100,
      config: { timeout: 5000 },
      setup_mode: false,
    },
  ],
  organizations: [
    {
      orgId: 'org_A',
      tags: ['startup', 'enterprise'],
      departments: [
        {
          depId: 2, // Era già presente
          name: 'Marketing',
          budget: 150000,
          active: true,
          employees: [{ empId: 'emp_99', role: 'manager' }],
        },
        {
          depId: 1, // Inserito con ADD
          name: 'Sales',
          budget: 150000,
          active: true,
          employees: [{ empId: 'emp_99', role: 'manager' }],
        },
        {
          depId: 3, // Inserito con ADD
          name: 'IT',
          budget: 0, // Invariato dal default dell'inserimento
          active: false, // Invariato dal default dell'inserimento
          employees: [], // Invariato
        },
      ],
    },
  ],
  weirdFormats: [
    {
      wfId: 'xyz',
      spacedProp: 'value',
      data: [1, 3],
    },
    {
      wfId: '999',
      spacedProp: 'value',
      data: [10, 20, 30, 1, 3],
    },
  ],
}
