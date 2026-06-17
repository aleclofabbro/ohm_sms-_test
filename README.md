# lib

i moduli di interesse sono in `src/ohm`

## avvia sandbox ui

```bash
npm run dev
```
servito su [http://localhost:5173/](http://localhost:5173/)


## test

deve essere presente una cartella `entities` allo stesso livello, accanto alla cartella di progetto.
```
d----- entities
d----- smsq
```
contenente tutti i json delle entita', ammucchiati senza struttura cartelle.

### lancia i test 

```bash
npm run test
# oppure
npm run test -- --watch 
```
