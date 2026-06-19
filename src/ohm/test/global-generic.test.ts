import { execQuery } from '../mingo-exec-query'
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

// ==========================================
// TEST QUERY
// ==========================================
const query = `
// TEST 1
SELECT User("user_1", "user_2")
  SET status = "active"
  set priority = 1
  Set metadata = {"source": "web", "verified": true}
DONE

// TEST 2
SELECT System(100)
  SET config.timeout = 5000
  SET setup_mode = false
DONE

// TEST 3
SELECT Organization("org_A")
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
sElEcT   WeirdFormat  (  "xyz"  ,   "999"  )
	SET    spacedProp    =    "value"     // commento a fine riga assorbito da jsonValue
  UPSERT   data=[1, 2, 3]
  REMOVE   data(2)
donE
`

// ==========================================
// MODEL DESCRIPTOR
// ==========================================
const modelDescriptor: ModelDescriptor = {
  users: {
    type: 'object',
    idProp: { name: 'userId' },
    props: {
      userId: { type: 'string' },
      status: { type: 'string' },
      priority: { type: 'number' },
      metadata: {
        type: 'object',
        props: {
          source: { type: 'string' },
          verified: { type: 'boolean' },
        },
      },
    },
  },
  systems: {
    type: 'object',
    idProp: { name: 'sysId' },
    props: {
      sysId: { type: 'number' },
      config: {
        type: 'object',
        props: {
          timeout: { type: 'number' },
        },
      },
      setup_mode: { type: 'boolean' },
    },
  },
  organizations: {
    type: 'object',
    idProp: { name: 'orgId' },
    props: {
      orgId: { type: 'string' },
      departments: {
        type: 'array',
        elemDescriptor: {
          type: 'object',
          idProp: { name: 'depId' },
          props: {
            depId: { type: 'number' },
            name: { type: 'string' },
            budget: { type: 'number' },
            active: { type: 'boolean' },
            employees: {
              type: 'array',
              elemDescriptor: {
                type: 'object',
                idProp: { name: 'empId' },
                props: {
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
        elemDescriptor: { type: 'string' },
      },
    },
  },
  weirdFormats: {
    type: 'object',
    idProp: { name: 'wfId' },
    props: {
      wfId: { type: 'string' },
      spacedProp: { type: 'string' },
      data: {
        type: 'array',
        elemDescriptor: { type: 'number' },
      },
    },
  },
}

// ==========================================
// TEST RUNNER
// ==========================================
test('global test', async () => {
  const result = await execQuery({
    io: {
      async requireModel(/* { selectedEntities } */) {
        return {
          model: initialModel,
        }
      },
    },
    modelDescriptor,
    query,
  })
  expect(result).not.toBeNull()
  expect(result.updatedModel).toEqual(expectedModel)
})