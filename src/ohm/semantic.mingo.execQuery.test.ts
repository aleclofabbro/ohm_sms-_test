import { execQuery } from './semantic.mingo.execQuery'

// --- Mock Data ---
// Usiamo un modello leggermente più complesso per testare in profondità
// la manipolazione degli array e il targeting annidato.
const getMockModel = () => ({
  Order: [
    {
      id: 'order_1',
      status: 'pending',
      customer: { name: 'Mario', type: 'standard' },
      items: [
        { id: 'item_1', name: 'Laptop', isGift: false },
        { id: 'item_2', name: 'Mouse', isGift: false },
      ],
      logs: [{ id: 'log_1', event: 'created' }],
    },
    {
      id: 'order_2',
      status: 'shipped',
      customer: { name: 'Luigi', type: 'premium' },
      items: [{ id: 'item_3', name: 'Keyboard', isGift: true }],
      logs: [],
    },
  ],
})

describe('Custom Entity Query Language - Integration Tests (Mingo)', () => {
  test('1. SET: Deve aggiornare i campi base e supportare la dot-notation', () => {
    const query = `
ON Order(order_1)
  SET status: "processing"
  SET customer.type: "premium"
`
    const result = execQuery(query, getMockModel()) as any
    const targetOrder = result.Order.find((o: any) => o.id === 'order_1')
    const untargetedOrder = result.Order.find((o: any) => o.id === 'order_2')
    // Asserzioni sull'elemento bersaglio
    expect(targetOrder.status).toBe('processing')
    expect(targetOrder.customer.type).toBe('premium')

    // Asserzioni di isolamento (il fratello non deve essere toccato)
    expect(untargetedOrder.status).toBe('shipped')
  })

  test('2. ADD: Deve appendere nuovi elementi a un array esistente', () => {
    const query = `
ON Order(order_2)
  ADD logs [{"id": "log_2", "event": "delivered"}]
`
    const result = execQuery(query, getMockModel()) as any
    const targetOrder = result.Order.find((o: any) => o.id === 'order_2')

    expect(targetOrder.logs).toHaveLength(1)
    expect(targetOrder.logs[0]).toEqual({ id: 'log_2', event: 'delivered' })
  })

  test("3. UPSERT: Deve aggiornare un elemento se l'ID esiste, o appenderlo se non esiste (Upsert)", () => {
    const query = `
ON Order(order_1)
  // item_1 esiste (verrà sovrascritto), item_4 è nuovo (verrà aggiunto)
  UPSERT items [{"id": "item_1", "name": "Laptop Pro", "isGift": true}, {"id": "item_4", "name": "Monitor", "isGift": false}]
`
    const result = execQuery(query, getMockModel()) as any
    const items = result.Order.find((o: any) => o.id === 'order_1').items

    expect(items).toHaveLength(3) // item_2 (intatto), item_1 (aggiornato), item_4 (nuovo)

    const item1 = items.find((i: any) => i.id === 'item_1')
    expect(item1.name).toBe('Laptop Pro')
    expect(item1.isGift).toBe(true)

    const item4 = items.find((i: any) => i.id === 'item_4')
    expect(item4).toBeDefined()
  })

  test('4. REMOVE: Deve rimuovere gli elementi specificati tramite ID', () => {
    const query = `
ON Order(order_1)
  REMOVE items(item_2)
`
    const result = execQuery(query, getMockModel()) as any
    const items = result.Order.find((o: any) => o.id === 'order_1').items

    expect(items).toHaveLength(1)
    expect(items[0].id).toBe('item_1') // Solo item_1 deve sopravvivere
  })

  test('5. NESTED BLOCK (ON ... UP): Deve operare in modo mirato su sotto-array', () => {
    const query = `
ON Order(order_1)
  ON items(item_1)
    SET isGift: true
  UP
`
    const result = execQuery(query, getMockModel()) as any
    const items = result.Order.find((o: any) => o.id === 'order_1').items

    const item1 = items.find((i: any) => i.id === 'item_1')
    const item2 = items.find((i: any) => i.id === 'item_2')

    // Il nested block deve aver modificato solo item_1
    expect(item1.isGift).toBe(true)
    expect(item2.isGift).toBe(false) // Fratello intatto
  })

  test('6. COMPLESSITÀ TOTALE: Esecuzione combinata di più istruzioni e blocchi', () => {
    const query = `
/* Query di manutenzione ordine */
ON Order(order_1, order_2)
  SET status: "archived"
  
  // Aggiorniamo gli items
  ON items(item_1, item_3)
    SET isGift: false
  UP
  
  // Rimuoviamo log vecchi e aggiungiamo quello di archiviazione
  REMOVE logs(log_1)
  ADD logs [{"id": "log_archived", "event": "System Archive"}]
`
    const result = execQuery(query, getMockModel()) as any

    // Controllo su order_1
    const o1 = result.Order.find((o: any) => o.id === 'order_1')
    expect(o1.status).toBe('archived')
    expect(o1.items.find((i: any) => i.id === 'item_1').isGift).toBe(false)
    expect(o1.logs.find((l: any) => l.id === 'log_1')).toBeUndefined()
    expect(o1.logs.find((l: any) => l.id === 'log_archived')).toBeDefined()

    // Controllo su order_2
    const o2 = result.Order.find((o: any) => o.id === 'order_2')
    expect(o2.status).toBe('archived')
    expect(o2.items.find((i: any) => i.id === 'item_3').isGift).toBe(false)
  })
})
