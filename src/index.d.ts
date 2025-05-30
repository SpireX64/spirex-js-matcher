// Package: @spirex/matcher
// Copyright 2025 (c) Artem Sobolenkov
// MIT License
// https://github.com/spirex64

/** A predicate function used to match the given context. */
export type TMatcherPredicate<Context extends object> = (
    context: Context,
) => boolean;

export type TMatcherSelector<Context extends object, T> = (
    context: Context,
) => T;

export type TMatcherComparator = {
    compare(value: unknown): boolean;
};

export type TMatcherContextPattern<Context extends object> = {
    [K in keyof Context]?: Context[K] | TMatcherComparator;
};

/** Utility type for merging two context objects */
export type TContextMerge<
    A extends object,
    B extends object | null = null,
> = B extends null ? A : Omit<A, keyof B> & B;

/**
 * Matcher interface for building conditional case logic based on context.
 *
 * @template Context The current context shape.
 * @template Cases A union of all case keys used so far.
 */
export interface IMatcher<
    Context extends object,
    Cases extends string = undefined,
> {
    /**
     * Extends the current context with new values.
     * Useful for mutating or enriching the context during matching.
     *
     * @param ext Additional context to merge. `null` is ignored.
     */
    withContext<ContextExt extends object | null>(
        ext: ContextExt,
    ): IMatcher<TContextMerge<Context, ContextExt>, Cases>;

    /**
     * Adds a new matching case using a boolean condition.
     *
     * @param condition The condition to evaluate.
     * @param resultCase The case identifier if the condition is true.
     */
    matchCase<Case extends string>(
        condition: boolean,
        resultCase: Case,
    ): IMatcher<Context, Cases | Case>;

    /**
     * Adds a new matching case using a context pattern.
     * Matches if all specified properties match the current context.
     *
     * @param pattern A pattern object of context to match against.
     * @param resultCase The case identifier if the pattern matches.
     */
    matchCase<Case extends string>(
        pattern: TMatcherContextPattern<Context>,
        resultCase: Case,
    ): IMatcher<Context, Cases | Case>;

    /**
     * Adds a new matching case using a predicate function.
     *
     * @param predicate A function that receives the current context and returns true if the case should match.
     * @param resultCase The case identifier if the predicate returns true.
     */
    matchCase<Case extends string>(
        predicate: TMatcherPredicate<Context>,
        resultCase: Case,
    ): IMatcher<Context, Cases | Case>;

    selectCase<Case extends string>(
        selector: TMatcherSelector<Context, Case>,
    ): IMatcher<Context, Cases | Case>;

    selectCase<Case extends string, T extends string & {}>(
        selector: TMatcherSelector<Context, T>,
        caseMap: Record<T, Case>,
    ): IMatcher<Context, Cases | Case>;

    /**
     * Defines the fallback case if no other cases match.
     *
     * @param resultCase The default case identifier.
     */
    otherwise<Case extends string>(
        resultCase: Case,
    ): IMatcher<Context, Cases | Case>;

    /**
     * Resolves and returns the matched case key.
     * Returns `undefined` if no case matched and no fallback is defined.
     */
    resolve(): Cases;

    /**
     * Resolves and maps the matched case to a result using the provided map.
     * All case keys must be present in the map.
     *
     * @param resultMap An object mapping case keys to result values.
     */
    resolve<Result>(resultMap: Record<Cases, Result>): Result;

    /**
     * Resolves and maps the matched case to a result using the provided map.
     * If the case is not present in the map, returns the fallback value.
     *
     * @param resultMap An object with optional mappings for some case keys.
     * @param fallback The fallback result if the matched case is not in the map.
     */
    resolve<Result>(
        resultMap: Partial<Record<Cases, Result>>,
        fallback: Result,
    ): Result;
}

/**
 * Creates a new matcher for the given context.
 *
 * @param context Optional initial context for matching.
 * @returns A matcher instance for defining and resolving cases.
 */
export function matcher<Context extends object = {}>(
    context?: Context,
): IMatcher<Context>;

export type TNumberComparatorOptions = {
    min?: number;
    max?: number;
    integer?: boolean;
    finite?: boolean;
};

export type TStringComparatorOptions = {
    minLen?: number;
    maxLen?: number;
    pattern?: RegExp;
};

export namespace matcher {
    export function number(
        options?: TNumberComparatorOptions,
    ): TMatcherComparator;

    export function string(
        options?: TStringComparatorOptions,
    ): TMatcherComparator;
}
