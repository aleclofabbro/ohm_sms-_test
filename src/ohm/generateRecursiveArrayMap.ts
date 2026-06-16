// --- Tipi e Interfacce ---

import type { AnyObject } from 'mingo/types';

/**
 * Rappresentazione generica di un'espressione della pipeline MongoDB.
 */
export type MongoExpression = AnyObject

export interface PipelineGeneratorArgs {
  /**
   * Il percorso cumulativo dal root del documento fino al livello attuale.
   * Es: [] per il root, ['User'] per il primo livello.
   */
  currentPath: string[];

  /**
   * I segmenti successivi da processare ricorsivamente.
   * Es: ['User', 'friends', 'hobbies'].
   * Quando è vuoto, la ricorsione si ferma e inietta la leafExpression.
   */
  nextPathSegment: string[];

  /**
   * L'espressione MongoDB finale (foglia) da applicare agli elementi dell'ultimo array.
   * Grazie allo scope isolato, la logica farà sempre riferimento a $$CURRENT_ITEM.
   */
  leafExpression: MongoExpression;
}

// --- Costanti Interne ---

const ITEM_ALIAS = "CURRENT_ITEM";
const ITEM_REF = `$$${ITEM_ALIAS}`;

// --- Funzione Principale ---

/**
 * Genera un blocco di manipolazione array ricorsivo per il MongoDB Aggregation Framework.
 * Utilizza $let per standardizzare lo scope e prevenire collisioni di variabili.
 */
export function generateRecursiveArrayMap(args: PipelineGeneratorArgs): MongoExpression {
  const { currentPath, nextPathSegment, leafExpression } = args;

  // 1. Caso Base: Se non ci sono più segmenti, siamo arrivati alla foglia.
  // Ritorniamo direttamente l'espressione di business iniettata dall'esterno.
  if (nextPathSegment.length === 0) {
    return leafExpression;
  }

  // 2. Determiniamo la chiave dell'array corrente da processare (es. 'User' o 'friends')
  const nextKey = nextPathSegment[0];

  // 3. Calcoliamo il path di input per leggere l'array attuale.
  // Se currentPath è vuoto, siamo al root document e usiamo la sintassi con singolo $.
  // Altrimenti, leggiamo dall'alias dell'iteratore genitore ($$CURRENT_ITEM).
  const inputPath = currentPath.length === 0 
    ? `$${nextKey}` 
    : `${ITEM_REF}.${nextKey}`;

  // 4. Prepariamo gli argomenti per il livello successivo di ricorsione
  const nextArgs: PipelineGeneratorArgs = {
    currentPath: [...currentPath, nextKey],
    nextPathSegment: nextPathSegment.slice(1),
    leafExpression // Propaghiamo la logica foglia fino in fondo
  };

  // 5. Risolviamo il livello interno (che sarà una nuova ricorsione o il caso base)
  const innerExpression = generateRecursiveArrayMap(nextArgs);

  // 6. Costruiamo e ritorniamo il blocco con lo scope protetto tramite $let
  return {
    [nextKey]: {
      $let: {
        vars: {
          arrayOriginale: { $ifNull: [inputPath, []] }
        },
        in: {
          $map: {
            input: "$$arrayOriginale",
            as: ITEM_ALIAS, // Utilizzo della costante "CURRENT_ITEM"
            in: {
              $mergeObjects: [
                ITEM_REF, // Merge con "$$CURRENT_ITEM" per preservare i campi non mutati
                innerExpression
              ]
            }
          }
        }
      }
    }
  };
}