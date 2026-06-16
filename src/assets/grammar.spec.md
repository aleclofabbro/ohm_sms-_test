Ecco il documento di specifica funzionale, strutturato per essere chiaro, esaustivo e accessibile anche a chi non ha familiarità diretta con il codice di parsing OHM.js.

---

# Documento di Specifica Funzionale: Custom Entity Query Language

## 1. Scopo del Linguaggio

Il **Custom Entity Query Language** è un linguaggio testuale dichiarativo progettato per eseguire mutazioni mirate (aggiornamenti, inserimenti e rimozioni) su entità dati complesse e gerarchiche.

Il linguaggio permette di selezionare entità o sotto-elementi tramite identificatori univoci e di applicare trasformazioni alle loro proprietà o alle liste a essi associate, supportando la navigazione ricorsiva all'interno delle strutture dati.

---

## 2. Architettura di Base

Una query è composta da due elementi fondamentali:

1. **Dichiarazione del Target (`ON`)**: Definisce su quali entità o sotto-elementi agiranno i comandi successivi.
2. **Dichiarazione delle Operazioni**: Una serie di istruzioni mutazionali (`SET`, `ADD`, `ADDSET`, `REMOVE`), scritte sequenzialmente e separate da ritorni a capo (`\n`).

---

## 3. Regole di Selezione (Targeting)

### 3.1 Identificatori (ID)

Gli ID utilizzati per selezionare entità o elementi di liste sono passati in formato grezzo (senza apici) e separati da virgole. Possono contenere lettere, numeri, trattini (`-`) e underscore (`_`).

* **Valido:** `user_01`, `123-abc`, `admin`
* **Sintassi:** `ON Entita(id1, id2, id3)`

### 3.2 Selezione Root (Livello Principale)

Ogni query deve aprirsi selezionando l'entità principale.

> `ON User(user_01, user_02)`

### 3.3 Selezione Annidata e Ritorno di Scope (`UP`)

È possibile "entrare" all'interno di una lista appartenente all'entità genitore per operare direttamente sui suoi elementi. Per terminare le operazioni sull'elemento annidato e tornare al livello genitore, si utilizza la keyword isolata `UP`.

> `ON friends(friend_01)`
> *...operazioni sul friend_01...*
> `UP`

---

## 4. Operazioni di Mutazione

I nomi dei campi o delle proprietà da modificare devono essere stringhe alfanumeriche. I valori associati alle operazioni (`fieldValue`) sono interpretati come stringhe JSON valide che catturano tutto il contenuto fino al termine della riga corrente.

### 4.1 Assegnazione (`SET`)

Imposta o sovrascrive il valore di una singola proprietà. È supportata la **dot-notation** per aggiornare proprietà annidate di tipo oggetto. È consentita una sola operazione `SET` per riga.

* **Sintassi:** `SET nomeCampo: valoreJSON`
* **Esempio:** `SET contacts.email: "info@example.com"`

### 4.2 Inserimento in Liste (`ADD`)

Aggiunge nuovi elementi all'interno di una proprietà di tipo lista/array.

* **Sintassi:** `ADD nomeCampo arrayJSON`
* **Esempio:** `ADD tags ["premium", "verified"]`

### 4.3 Inserimento/Aggiornamento in Liste (`ADDSET`)

Esegue un'operazione di *upsert* su una lista. Se l'elemento esiste già (sulla base del suo ID), viene aggiornato; altrimenti viene aggiunto.

* **Sintassi:** `ADDSET nomeCampo arrayJSON`
* **Esempio:** `ADDSET roles [{"id": "r1", "name": "editor"}]`

### 4.4 Rimozione da Liste (`REMOVE`)

Rimuove elementi specifici da una proprietà di tipo lista, utilizzando i loro identificatori esatti.

* **Sintassi:** `REMOVE nomeCampo(id1, id2)`
* **Esempio:** `REMOVE tags(obsolete, temporary)`

---

## 5. Commenti e Documentazione

Il linguaggio supporta l'inserimento di commenti per documentare le query, ignorati dal motore di esecuzione:

* **Commento su riga singola (stile SQL):** `-- Questo è un commento`
* **Commento su riga singola (stile JS):** `// Questo è un commento`
* **Commento multi-riga:** `/* Questo è un blocco di commento */`

---

## 6. Esempio Completo di Flusso

Di seguito un caso d'uso che illustra l'intera capacità espressiva del linguaggio:

```text
/* Esempio di aggiornamento di un Ordine e dei suoi elementi */

ON Order(order_999)
  -- 1. Aggiorna campi base tramite assegnazione e dot-notation
  SET status: "shipped"
  SET delivery.address.zip: "10100"
  
  // 2. Aggiunge nuovi log all'array history
  ADD history [ {"event": "dispatched", "time": "2023-10-25"} ]
  
  -- 3. Entra in un sotto-contesto per modificare elementi specifici della lista 'items'
  ON items(item_01, item_03)
    SET isGift: true
  UP
  
  // 4. Tornato al livello Order, rimuove eventuali codici promozionali obsoleti
  REMOVE promoCodes(summer_sale)

```