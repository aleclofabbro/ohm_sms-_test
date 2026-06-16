// import specs from './openapi.json'
import { $match, $set } from 'mingo/operators/pipeline'
import type { AnyObject } from 'mingo/types'
import grammar from '../assets/grammar.ohm-bundle'
import { Context, Aggregator, ProcessingMode } from 'mingo'
import { $map, $eq, $filter } from 'mingo/operators/expression'
import { generateRecursiveArrayMap } from './semantic.fn'


// 2. Creiamo l'Oggetto di Semantica per generare l'AST
const semantics = grammar.createSemantics();

semantics.addOperation('toAST', {
    Query(target, statements) {
        return {
            rootTarget: target.toAST(),
            statements: statements.children.map(c => c.toAST())
        };
    },
    Statement(op) {
        return op.toAST();
    },
    NestedBlock(target, statements, _up) {
        return {
            type: 'NESTED',
            target: target.toAST(),
            statements: statements.children.map(c => c.toAST())
        };
    },
    Target(_on, ident, _lparen, ids, _rparen) {
        return {
            name: ident.sourceString,
            ids: ids.asIteration().children.map(c => c.sourceString)
        };
    },
    SetOp(_set, path, _colon, jsonMock) {
        return { type: 'SET', field: path.sourceString, value: JSON.parse(jsonMock.sourceString.trim()) };
    },
    AddOp(_add, ident, jsonMock) {
        return { type: 'ADD', field: ident.sourceString, value: JSON.parse(jsonMock.sourceString.trim()) };
    },
    AddSetOp(_addset, ident, jsonMock) {
        return { type: 'ADDSET', field: ident.sourceString, value: JSON.parse(jsonMock.sourceString.trim()) };
    },
    RemoveOp(_remove, ident, _lparen, ids, _rparen) {
        return { type: 'REMOVE', field: ident.sourceString, ids: ids.asIteration().children.map(c => c.sourceString) };
    }
});

// 3. Generatore della Pipeline Mongo (Il Motore Ricorsivo)
function buildMongoPipelineBlock(statements, isRoot = true) {
    let mutations = {};

    // A. Elaboriamo le operazioni atomiche di base (Leaf State)
    statements.forEach(stmt => {
        const prefix = isRoot ? "$" : "$$CURRENT_ITEM.";

        switch (stmt.type) {
            case 'SET':
                // Per le operazioni SET usiamo un approccio di merge diretto
                mutations[stmt.field] = stmt.value;
                break;

            case 'ADD':
                // $concatArrays unisce l'array esistente con i nuovi elementi
                mutations[stmt.field] = {
                    $concatArrays: [
                        { $ifNull: [prefix + stmt.field, []] },
                        Array.isArray(stmt.value) ? stmt.value : [stmt.value]
                    ]
                };
                break;

            case 'REMOVE':
                // $filter rimuove gli elementi che matchano gli ID passati
                mutations[stmt.field] = {
                    $filter: {
                        input: { $ifNull: [prefix + stmt.field, []] },
                        as: "F_ITEM",
                        cond: { $not: { $in: ["$$F_ITEM.id", stmt.ids] } }
                    }
                };
                break;
            
            // ADDSET richiederebbe una logica complessa di $map + $concatArrays.
            // Qui generiamo uno stub espandibile in base a come gestisci le primary key interne.
            case 'ADDSET': 
                 mutations[stmt.field] = { /* Logica Upsert tramite map o $setUnion */ };
                 break;
        }
    });

    // B. Elaboriamo i blocchi annidati (Recursive State - Il core dell'architettura)
    const nestedBlocks = statements.filter(s => s.type === 'NESTED');
    
    nestedBlocks.forEach(nested => {
        const arrayField = nested.target.name;
        const targetIds = nested.target.ids;
        const prefix = isRoot ? "$" : "$$CURRENT_ITEM.";

        // Chiamata ricorsiva: genera le mutazioni interne
        const innerMutations = buildMongoPipelineBlock(nested.statements, false);

        // Pattern Architetturale Dinamico: $let + $map + $mergeObjects
        mutations[arrayField] = {
            $let: {
                vars: { 
                    arrayToProcess: { $ifNull: [prefix + arrayField, []] } 
                },
                in: {
                    $map: {
                        input: "$$arrayToProcess",
                        as: "CURRENT_ITEM", // Lo Shadowing Benefico che mantiene lo stato pulito
                        in: {
                            $cond: {
                                if: { $in: ["$$CURRENT_ITEM.id", targetIds] },
                                then: {
                                    $mergeObjects: [
                                        "$$CURRENT_ITEM",
                                        innerMutations // Le mutazioni calcolate ricorsivamente
                                    ]
                                },
                                else: "$$CURRENT_ITEM" // Nessuna mutazione se l'ID non fa match
                            }
                        }
                    }
                }
            }
        };
    });

    return mutations;
}

// 4. Funzione Wrapper Pubblica
function compileQueryToMongo(queryString, model = {}) {
    const matchResult = grammar.match(queryString);
    
    if (matchResult.failed()) {
        throw new Error("Errore di Sintassi nella Query:\n" + matchResult.message);
    }

    // Costruisce l'AST
    const ast = semantics(matchResult).toAST();
    
    // Il target radice (es: ON Order(order_999)) detta la query di match principale
    const collectionName = ast.rootTarget.name;
    const documentIds = ast.rootTarget.ids;

    // Genera l'oggetto di mutazione ricorsivo
    const pipelineSetStage = buildMongoPipelineBlock(ast.statements, true);

    // Ritorna la configurazione completa per il driver MongoDB
    return {
        collection: collectionName,
        operation: 'updateMany',
        filter: { id: { $in: documentIds } },
        pipeline: [
            { $set: pipelineSetStage }
        ]
    };
}
