// Package: @spirex/matcher
// Copyright 2025 (c) Artem Sobolenkov
// MIT License
// https://github.com/spirex64

/** A predicate function used to match the given context. */
export type TMatcherPredicate<Context extends object> = (
    context: Context,
) => boolean;

/**
 * A function that selects a value from the matcher context.
 *
 * @template Context - The type of the context.
 * @template T - The type of the selected value.
 * @param context - The current matcher context.
 * @returns The selected value.
 */
export type TMatcherSelector<Context extends object, T> = (
    context: Context,
) => T;

/**
 * Interface for a value comparator used in matcher patterns.
 * Can be used to define advanced comparison logic for context fields.
 */
export type IMatcherComparator = {
    /**
     * Test a value to determine if it satisfies certain conditions.
     *
     * @param value - The value to test.
     * @returns `true` if the value matches the condition, false otherwise.
     */
    test(value: unknown): boolean;
};

/**
 * A pattern object that can be used to match against the matcher context.
 * Each field can be a direct value or a custom comparator.
 *
 * @template Context - The type of the matcher context.
 */
export type TMatcherContextPattern<Context extends object> = {
    [K in keyof Context]?: Context[K] | IMatcherComparator;
};

/** Utility type for merging two context objects */
export type TContextMerge<
    A extends object,
    B extends object | null = null,
> = B extends null ? A : Omit<A, keyof B> & B;

/**
 * Matcher branch interface for building conditional case logic based on context.
 *
 * @template Context The current context shape.
 * @template Cases A union of all case keys used so far.
 */
export interface IMatcherBranch<
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
    ): IMatcherBranch<TContextMerge<Context, ContextExt>, Cases>;

    forward<ForwardCases extends string, BranchContext extends object>(
        delegate: TMatcherBranchDelegate<Context, Cases, ForwardCases, BranchContext>,
    ): IMatcherBranch<BranchContext, Cases | ForwardCases>;

    /**
     * Adds a new matching case using a boolean condition.
     *
     * @param condition The condition to evaluate.
     * @param resultCase The case identifier if the condition is true.
     */
    matchCase<Case extends string>(
        condition: boolean,
        resultCase: Case | TMatcherBranchDelegate<Context, Cases, Case>,
    ): IMatcherBranch<Context, Cases | Case>;

    /**
     * Adds a new matching case using a context pattern.
     * Matches if all specified properties match the current context.
     *
     * @param pattern A pattern object of context to match against.
     * @param resultCase The case identifier if the pattern matches.
     */
    matchCase<Case extends string>(
        pattern: TMatcherContextPattern<Context>,
        resultCase: Case | TMatcherBranchDelegate<Context, Cases, Case>,
    ): IMatcherBranch<Context, Cases | Case>;

    /**
     * Adds a new matching case using a predicate function.
     *
     * @param predicate A function that receives the current context and returns true if the case should match.
     * @param resultCase The case identifier if the predicate returns true.
     */
    matchCase<Case extends string>(
        predicate: TMatcherPredicate<Context>,
        resultCase: Case | TMatcherBranchDelegate<Context, Cases, Case>,
    ): IMatcherBranch<Context, Cases | Case>;

    /**
     * Selects a case key based on a value extracted from the matcher context.
     * Useful for when the case depends on some property or computation.
     *
     * @template Case - The resulting case key.
     * @param selector - A function that selects the case key from the context.
     * @returns The updated matcher instance.
     */
    selectCase<Case extends string>(
        selector: TMatcherSelector<Context, Case>,
    ): IMatcherBranch<Context, Cases | Case>;

    /**
     * Selects a case key based on a context value and maps it to a final case using a provided map.
     *
     * @template Case - The resulting case key.
     * @template T - The intermediate key selected from the context.
     * @param selector - A function that selects a key from the context.
     * @param caseMap - A map that converts the selected key into a final case key.
     * @returns The updated matcher instance.
     */
    selectCase<Case extends string, T extends string & {}>(
        selector: TMatcherSelector<Context, T>,
        caseMap: Record<T, Case | TMatcherBranchDelegate<Context, Cases, Case>>,
    ): IMatcherBranch<Context, Cases | Case>;

    /**
     * Defines the fallback case if no other cases match.
     *
     * @param resultCase The default case identifier.
     */
    otherwise<Case extends string>(
        resultCase: Case,
    ): IMatcherBranch<Context, Cases | Case>;
}

export type TMatcherBranchDelegate<
    Context extends object,
    Cases extends string,
    BranchCases extends string,
    BranchContext extends object = Context,
> = (
    branch: IMatcherBranch<Context, Cases>,
) => IMatcherBranch<BranchContext, BranchCases>;

/**
 * The main interface for the pattern matcher.
 * Used for evaluate the match chain and retrieve the resolved output.
 *
 * @template Context - The type of the input context being matched.
 * @template Cases - The resulting type after matching cases.
 */
export interface IMatcher<Context extends object, Cases extends string = undefined> extends IMatcherBranch<Context, Cases> {
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

    // region: Override IMatcherBranch

    withContext<ContextExt extends object | null>(
        ext: ContextExt,
    ): IMatcher<TContextMerge<Context, ContextExt>, Cases>;

    forward<ForwardCases extends string, BranchContext extends object>(
        delegate: TMatcherBranchDelegate<Context, Cases, ForwardCases, BranchContext>,
    ): IMatcher<BranchContext, Cases | ForwardCases>;

    matchCase<Case extends string>(
        condition: boolean,
        resultCase: Case | TMatcherBranchDelegate<Context, Cases, Case>,
    ): IMatcher<Context, Cases | Case>;

    matchCase<Case extends string>(
        pattern: TMatcherContextPattern<Context>,
        resultCase: Case | TMatcherBranchDelegate<Context, Cases, Case>,
    ): IMatcher<Context, Cases | Case>;

    matchCase<Case extends string>(
        predicate: TMatcherPredicate<Context>,
        resultCase: Case | TMatcherBranchDelegate<Context, Cases, Case>,
    ): IMatcher<Context, Cases | Case>;

    selectCase<Case extends string>(
        selector: TMatcherSelector<Context, Case>,
    ): IMatcher<Context, Cases | Case>;

    selectCase<Case extends string, T extends string & {}>(
        selector: TMatcherSelector<Context, T>,
        caseMap: Record<T, Case | TMatcherBranchDelegate<Context, Cases, Case>>,
    ): IMatcher<Context, Cases | Case>;

    otherwise<Case extends string>(
        resultCase: Case,
    ): IMatcher<Context, Cases | Case>;

    // endregion: Override IMatcherBranch
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
    /**
     * Creates a numeric comparator with optional constraints.
     *
     * @param options - Optional constraints such as min, max, integer, or finite.
     * @returns A comparator that checks whether a number satisfies the given constraints.
     */
    export function number(
        options?: TNumberComparatorOptions,
    ): IMatcherComparator;

    /**
     * Creates a string comparator with optional constraints.
     *
     * @param options - Optional constraints such as minLen, maxLen, or pattern.
     * @returns A comparator that checks whether a string satisfies the given constraints.
     */
    export function string(
        options?: TStringComparatorOptions,
    ): IMatcherComparator;
}
