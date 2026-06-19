/**
 * alcune type declarations che ho copiate dalla lib mingo in node_modules
 * sono qui solo come reference per lo sviluppo la semantica
 */

import type { Context, ProcessingMode } from "./core";
import type { AnyObject, UpdateExpr, Any, SortSpec, CollationSpec, Criteria, Options, Projection } from './types';
export type PipelineStage = {
    $addFields: AnyObject;
} | {
    $set: AnyObject;
} | {
    $project: AnyObject;
} | {
    $unset: string | string[];
} | {
    $replaceRoot: {
        newRoot: AnyObject;
    };
} | {
    $replaceWith: AnyObject;
};
export interface Modifier<T> {
    $addToSet?: UpdateExpr<T>;
    $bit?: UpdateExpr<T, SingleKeyRecord<"and" | "or" | "xor", number>>;
    $currentDate?: UpdateExpr<T, true | {
        $type: "date" | "timestamp";
    }>;
    $inc?: UpdateExpr<T, number>;
    $max?: UpdateExpr<T>;
    $min?: UpdateExpr<T>;
    $mul?: UpdateExpr<T, number>;
    $pop?: UpdateExpr<T, 1 | -1>;
    $pull?: UpdateExpr<T>;
    $pullAll?: UpdateExpr<T, Any[]>;
    $push?: UpdateExpr<T>;
    $rename?: UpdateExpr<T, string>;
    $set?: UpdateExpr<T>;
    $unset?: UpdateExpr<T, "">;
}
/**
 * Supported cloning modes.
 * - "deep": Performs a recursive deep clone of the object.
 * - "copy": Performs a shallow copy of the object. @default
 * - "none": No cloning. Uses the value as given. NOT RECOMMENDED.
 */
export type CloneMode = "deep" | "copy" | "none";
/** Extra configuration to customize the update operation */
export interface UpdateConfig {
    /** An array of filter documents that determine which array elements to modify for an update operation on an array field. */
    arrayFilters?: AnyObject[];
    /** Determines how to set values to fields. */
    cloneMode?: CloneMode;
    /** {@link updateOne} updates the first document in the sort order specified by this argument. */
    sort?: SortSpec;
    /** The collation to use for the operation. Merged into {@link Options.collation} when specified. */
    collation?: CollationSpec;
    /** A document with a list of variables. Merged into {@link Options.variables} when specified. */
    let?: AnyObject;
}
/**
 * Updates the given object with the expression.
 *
 * @param obj The object to update.
 * @param modifier The modifications to apply.
 * @param arrayFilters Filters to apply to nested items.
 * @param condition Conditions to validate before performing update.
 * @param options Update options to override defaults.
 * @returns {string[]} A list of modified field paths in the object.
 */
export declare function update<T extends AnyObject>(obj: T, modifier: Modifier<T>, arrayFilters?: AnyObject[], condition?: Criteria<T>, options?: {
    cloneMode?: CloneMode;
    queryOptions?: Partial<Options>;
}): string[];
/**
 * Updates all documents that match the specified filter for a collection.
 *
 * Supports both aggregation pipeline updates and standard update operators.
 * Documents in the collection may be replaced or modified.
 *
 * @param documents - The array of documents to update.
 * @param condition - The selection criteria for the update.
 * @param modifier - The modifications to apply.
 * @param updateConfig - Optional update config parameters.
 * @param options - Optional settings to control update behavior.
 */
export declare function updateMany<T extends AnyObject>(documents: T[], condition: Criteria<T>, modifier: Modifier<T> | PipelineStage[], updateConfig?: UpdateConfig, options?: Partial<Options>): {
    matchedCount: number;
    modifiedCount: number;
};
/**
 * Updates a single document within the collection based on the filter.
 *
 * Supports both aggregation pipeline updates and standard update operators.
 * Returns the number of documents matched and modified.
 * Objects in the array may be modified inplace or replaced entirely.
 *
 * @param documents - The array of documents to update.
 * @param condition - The selection criteria for the update.
 * @param modifier - The modifications to apply.
 * @param updateConfig - Optional update config parameters.
 * @param options - Optional settings to control update behavior.
 */
export declare function updateOne<T extends AnyObject>(documents: T[], condition: Criteria<T>, modifier: Modifier<T> | PipelineStage[], updateConfig?: UpdateConfig, options?: Partial<Options>): UpdateResult;
/** Result of update operation */
export interface UpdateResult {
    /** Count of objects that matched filter. */
    readonly matchedCount: number;
    /** Count of objects modified. */
    readonly modifiedCount: number;
    /** Array of modified fields of single object. Available only for {@link updateOne}. */
    readonly modifiedFields?: string[];
    /** Index of the modified object within the collection. Available only for {@link updateOne}. */
    readonly modifiedIndex?: number;
}

export declare class Query<T = AnyObject> extends QueryBase<T> {
    constructor(condition: Criteria<T>, options?: Partial<Options>);
}
export declare class Aggregator extends AggregatorBase {
    constructor(pipeline: AnyObject[], options?: Partial<Options>);
}
/**
 * Finds documents in a collection that match the specified criteria.
 *
 * @template R - The type of the documents in the collection.
 * @param collection - The source collection to search.
 * @param condition - The query criteria to filter the documents.
 * @param projection - Optional. Specifies the fields to include or exclude in the returned documents.
 * @param options - Optional. Additional options to customize the query behavior.
 * @returns A `Cursor` object that allows iteration over the matching documents.
 */
export declare function find<R = AnyObject, T = AnyObject>(collection: Source, condition: Criteria<T>, projection?: Projection<R>, options?: Partial<Options>): Cursor<R>;
/**
 * Performs an aggregation operation on the provided collection using the specified pipeline.
 *
 * @param collection - The input data source to aggregate.
 * @param pipeline - An array of aggregation stages to process the collection.
 * @param options - Optional settings to customize the aggregation behavior.
 * @returns The result of the aggregation as an array of objects.
 */
export declare function aggregate(collection: Source, pipeline: AnyObject[], options?: Partial<Options>): AnyObject[];
export declare function update<T extends AnyObject>(obj: T, modifier: updater.Modifier<T>, arrayFilters?: AnyObject[], condition?: Criteria<T>, options?: {
    cloneMode?: updater.CloneMode;
    queryOptions?: Partial<Options>;
}): string[];
export declare function updateMany<T extends AnyObject>(documents: T[], condition: Criteria<T>, modifer: updater.Modifier<T> | updater.PipelineStage[], updateConfig?: updater.UpdateConfig, options?: Partial<Options>): {
    matchedCount: number;
    modifiedCount: number;
};
export declare function updateOne<T extends AnyObject>(documents: T[], condition: Criteria<T>, modifier: updater.Modifier<T> | updater.PipelineStage[], updateConfig?: updater.UpdateConfig, options?: Partial<Options>): updater.UpdateResult;
declare const _default: {
    Aggregator: typeof Aggregator;
    Context: typeof Context;
    ProcessingMode: typeof ProcessingMode;
    Query: typeof Query;
    aggregate: typeof aggregate;
    find: typeof find;
    update: typeof update;
    updateMany: typeof updateMany;
    updateOne: typeof updateOne;
};
export default _default;

export type { AccumulatorOperator, ExpressionOperator, PipelineOperator, ProjectionOperator, QueryOperator, UpdateOperator, WindowOperator } from "./operators/typings";
export type Any = unknown;
export type AnyObject = Record<string, Any>;
export type ArrayOrObject = AnyObject | Any[];
export type SortSpec = Record<string, 1 | -1>;
export interface Callback<R = Any, T = Any> {
    (...args: T[]): R;
}
export interface Predicate<T = Any> {
    (...args: T[]): boolean;
}
export interface Comparator<T = Any> {
    (left: T, right: T): number;
}
type CommonTypes = "null" | "undefined" | "string" | "date" | "array" | "object";
export type JsType = CommonTypes | "boolean" | "number" | "string" | "regexp" | "function";
export type BsonType = CommonTypes | "bool" | "int" | "long" | "double" | "decimal" | "regex";
/**
 * Resolves the given string to a Collection.
 * This is useful for operators that require a second collection to use such as $lookup and $out.
 * The collection is not cached and will be resolved each time it is used.
 */
export type CollectionResolver = (name: string) => AnyObject[];
/** Specification for collation options */
export interface CollationSpec {
    readonly locale: string;
    readonly caseLevel?: boolean;
    readonly caseFirst?: "upper" | "lower" | "off";
    readonly strength?: 1 | 2 | 3;
    readonly numericOrdering?: boolean;
    readonly alternate?: string;
    readonly maxVariable?: never;
    readonly backwards?: never;
}
/**
 * JSON schema validator
 */
export type JsonSchemaValidator = (schema: AnyObject) => Predicate<AnyObject>;
/**
 * Generic options interface passed down to all operators
 */
export interface Options {
    /** The key that is used to lookup the ID value of a document. @default "_id". */
    readonly idKey: string;
    /** The collation specification for string sorting operations. */
    readonly collation?: CollationSpec;
    /** Determines how to treat inputs and outputs. @default ProcessingMode.CLONE_OFF. */
    readonly processingMode: ProcessingMode;
    /** Enforces strict MongoDB compatibilty. See README. @default true. */
    readonly useStrictMode: boolean;
    /** Enable or disable custom script execution using `$where`, `$accumulator`, and `$function` operators. @default true. */
    readonly scriptEnabled: boolean;
    /** When true, throws an error if an operator fails otherwise set to null. @default true. */
    readonly failOnError: boolean;
    /** This option does nothing and will be removed in future versions. @deprecated */
    readonly hashFunction?: (x: Any) => number;
    /** Function to resolve strings to arrays for use with operators that reference other collections such as; `$lookup`, `$out` and `$merge`. */
    readonly collectionResolver?: CollectionResolver;
    /** JSON schema validator to use with the '$jsonSchema' operator. Required in order to use the operator. */
    readonly jsonSchemaValidator?: JsonSchemaValidator;
    /** Global variables. */
    readonly variables?: Readonly<AnyObject>;
    /** Extra references to operators to be used for processing. */
    readonly context: Context;
}
type Primitive = string | number | boolean | bigint | symbol | null | undefined;
type NumericIndex = `${number}`;
type UpdateDotPaths<T> = {
    [K in keyof T & string]: T[K] extends Primitive ? K : T[K] extends Array<infer U> ? K | `${K}.${NumericIndex}` | `${K}.${NumericIndex}.${UpdateDotPaths<U>}` | `${K}.$` | `${K}.$.${UpdateDotPaths<U>}` | `${K}.$[]` | `${K}.$[].${UpdateDotPaths<U>}` | `${K}.$[${string}]` | `${K}.$[${string}].${UpdateDotPaths<U>}` : K | `${K}.${UpdateDotPaths<T[K]>}`;
}[keyof T & string];
type SingleDollar<S extends string> = S extends `${string}$.${string}$.${string}` ? never : S;
type NoChainedPositional<S extends string> = S extends `${string}$.${string}$[]${string}` ? never : S extends `${string}$[].${string}$.${string}` ? never : S;
type UpdatePath<T> = UpdateDotPaths<T> extends infer P extends string ? P extends SingleDollar<P> ? P extends NoChainedPositional<P> ? P : never : never : never;
export type UpdateExpr<T, V = Any> = Partial<Record<UpdatePath<T>, V>>;
type FilterDotPaths<T> = {
    [K in keyof T & string]: T[K] extends Primitive ? K : T[K] extends Array<infer U> ? K | `${K}.${NumericIndex}` | `${K}.${NumericIndex}.${FilterDotPaths<U>}` | (U extends Primitive ? never : `${K}.${FilterDotPaths<U>}`) : K | `${K}.${FilterDotPaths<T[K]>}`;
}[keyof T & string];
export type Criteria<T> = Partial<Record<FilterDotPaths<T>, Any>>;
type ProjectPath<T> = {
    [K in keyof T & string]: K | `${K}.${string}`;
}[keyof T & string];
export type Projection<T> = Partial<Record<ProjectPath<T>, Any>>;
