Ecco il documento di specifica formale della grammatica, strutturato appositamente per guidare lo sviluppo del motore semantico.

---

# Documento di Specifica: Custom Query Language (CQL)

Questo documento definisce le regole sintattiche e le direttive architetturali per l'implementazione semantica del Custom Query Language, orientato alla mutazione di entità JSON-like.

## 1. Regole Generali e Lessicali

Prima di implementare le operazioni, il motore semantico deve tenere in considerazione le seguenti regole base imposte dal parser:

* **Case-Insensitivity:** Le parole chiave (`SELECT`, `SET`, `ADD`, `UPSERT`, `REMOVE`, `DONE`) sono case-insensitive. Il parser le riconoscerà indipendentemente dal formato.
* **Spazi e Tabulazioni:** Vengono ignorati. Il parser non è sensibile all'indentazione.
* **Terminazione di Riga:** Il carattere "a capo" (`\n`) è **strutturale**. Agisce come terminatore implicito per tutte le istruzioni di mutazione (`SET`, `ADD`, `UPSERT`). Non è consentito avere più istruzioni sulla stessa riga.
* **Commenti:** I commenti in linea (`//`) e multiriga (`/* ... */`) vengono assorbiti a livello lessicale e ignorati, eccetto quando posti a fine riga dopo un'assegnazione (vedi sezione *Valori e Parsing JSON*).

---

## 2. Blocchi di Contesto: `SELECT` e `DONE`

Il linguaggio è basato su blocchi contestuali che definiscono il target delle mutazioni successive.

### Entity-Level Target (Radice)

Definisce l'entità principale su cui operare.

* **Sintassi:** `SELECT EntityName("id1", "id2", ...)` ... `DONE`
* **Azione Semantica:** Il motore deve recuperare dal database le entità specificate dalla lista di ID. Tutte le istruzioni interne al blocco si applicano in batch a tutte le entità selezionate.

### Nested Sub-Targeting (Interno)

Definisce un target secondario all'interno di un array appartenente all'entità radice.

* **Sintassi:** `SELECT property.path("id_A", 2)` ... `DONE`
* **Azione Semantica:** Il motore deve individuare l'array specificato dal `property.path`. Successivamente, deve filtrare gli elementi interni all'array che corrispondono agli ID forniti e applicare le mutazioni interne al blocco solo a quegli elementi specifici.

---

## 3. Istruzioni di Mutazione

Queste istruzioni si trovano all'interno di un blocco `SELECT` e definiscono le modifiche da applicare al target corrente (Entità radice o Sub-target).

| Comando | Sintassi Esempio | Comportamento Semantico Richiesto |
| --- | --- | --- |
| **`SET`** | `SET prop.path = value` | Sovrascrive il valore alla fine del `prop.path`. Se il percorso non esiste, lo crea. Sostituisce interamente gli array se `value` è un array. |
| **`ADD`** | `ADD arrayProp = [...]` | Aggiunge uno o più elementi all'array specificato. Se l'array non esiste, deve essere inizializzato. Genera un errore semantico se `arrayProp` esiste ma non è un array. |
| **`UPSERT`** | `UPSERT arrayProp = [...]` | Inserisce i nuovi elementi; se un elemento con lo stesso identificatore esiste già nell'array, lo aggiorna/sostituisce. |
| **`REMOVE`** | `REMOVE arrayProp("id1")` | Rimuove dall'array gli elementi i cui identificatori corrispondono a quelli passati tra parentesi. Ignora gli ID non trovati. |

---

## 4. Identificatori e Percorsi (Left-Hand Side)

La parte a sinistra del segno di uguale (`=`) definisce la destinazione della mutazione.

* **Identificatori Validi:** Iniziano con una lettera o un underscore (`_`), seguiti da caratteri alfanumerici o underscore. (es. `status`, `_metadata_2`). Non contengono spazi e non vanno virgolettati.
* **Dot-Notation (`PropPath`):** Gli identificatori possono essere concatenati con un punto (`.`) per navigare oggetti annidati (es. `config.network.timeout`).
* **Responsabilità Semantica:** Se un'istruzione punta a `a.b.c = 10` e `a.b` è attualmente `null` o non definito, il motore semantico dovrebbe istanziare oggetti vuoti lungo il percorso prima di assegnare il valore finale.

---

## 5. Valori e Parsing JSON (Right-Hand Side)

La parte a destra del segno di uguale (`=`) per i comandi `SET`, `ADD` e `UPSERT` è gestita dalla grammatica come uno **Stub Lessicale**.

* **Comportamento del Parser:** OHM.js cattura *qualsiasi carattere* presente dopo il segno `=` fino alla fine della riga (`\n`).
* **Responsabilità Semantica:** 1. Il motore semantico riceverà una stringa grezza (es. `{"tagline": "Hello", points: 30} // note`).
2. Il motore **deve** implementare una logica di sanitizzazione (es. rimuovere eventuali commenti `//` rimasti in coda alla stringa).
3. Il motore **deve** parsare la stringa tramite un parser JSON/JSON5 per ottenere l'oggetto o l'array JavaScript reale da applicare.

---

## 6. Identificatori di Targeting (ID)

Sia nei blocchi `SELECT` che nel comando `REMOVE`, le entità e gli elementi degli array sono targettizzati tramite ID passati tra parentesi.

* **Tipi Supportati:** * **Stringhe:** Devono essere sempre delimitate da doppi apici (es. `"user_1"`).
* **Interi:** Numeri positivi o negativi senza apici (es. `42`, `-7`).


* **Multi-ID:** I comandi accettano una lista separata da virgole (es. `("id1", "id2")`). Il motore semantico deve iterare su questa lista per applicare l'operazione in batch.