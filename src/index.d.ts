// Package: @spirex/matcher
// Copyright 2025 (c) Artem Sobolenkov
// MIT License
// https://github.com/spirex64

/** Utility type that takes an object type and makes the hover overlay more readable */
type Prettify<T extends object> = {
    [K in keyof T]: T[K];
} & {};

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

export type TMatcherResolver<
    Result,
    Context extends object,
    Case extends string,
> = (context: Context, caseKey: Case) => Result;

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

/**
 * A function that transforms the current context into a new context.
 *
 * @template Context - Origin context type
 * @template ContextMapped - New context type after mapping
 */
export type TMatcherContextMapper<
    Context extends object,
    ContextMapped extends object,
> = (context: Context) => ContextMapped;

/**
 * A delegate function to merge the origin context with the result context of a matcher branch.
 *
 * @template CurrentContext The current (inner) context.
 * @template ParentContext The original (parent) context.
 * @template ResultContext The final merged context.
 *
 * @param context The context returned from the matcher or matcher branch.
 * @param parentContext The original parent context.
 * @returns Merged context to continue processing with.
 */
export type TMatcherContextMergeDelegate<
    CurrentContext extends object,
    ParentContext extends object,
    ResultContext extends object,
> = (context: CurrentContext, parentContext: ParentContext) => ResultContext;

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
    ParentContext extends object = Context,
> {
    /**
     * Extends the current matcher context by merging additional fields.
     *
     * Unlike `mapContext`, which replaces the entire context,
     * `withContext` merges the provided object into the existing context,
     * making the new fields available in subsequent matcher calls.
     *
     * @template ContextExt - the type of the additional context fields to merge
     *
     * @param ext - an object containing new fields to merge into the current context
     * @returns a new matcher branch with the extended context
     *
     * @example
     * ```ts
     * matcher({ user: { name: 'Alice' } })
     *   .withContext({ isLoggedIn: true })
     *   .matchCase({ isLoggedIn: true }, 'loggedInUser')
     *   .otherwise('guestUser')
     *   .resolve(); // 'loggedInUser'
     * ```
     */
    withContext<ContextExt extends object | null>(
        ext: ContextExt,
    ): IMatcherBranch<
        Prettify<TContextMerge<Context, ContextExt>>,
        Cases,
        ParentContext
    >;

    /**
     * Replaces the current context with the result of the provided mapper function.
     *
     * Unlike `withContext`, which merges new fields into the existing context,
     * `mapContext` completely replaces the context passed to subsequent matcher method calls.
     *
     * @param mapper - a function that receives the current context and returns a new one
     * @returns a new matcher branch with the updated context
     *
     * @example
     * ```ts
     * matcher({ numbers: [1, 2, 3] })
     *   .mapContext(ctx => ({ sum: ctx.numbers.reduce((a, b) => a + b, 0) }))
     *   .matchCase(ctx => ctx.sum > 5, 'largeSum')
     *   .otherwise('smallSum')
     *   .resolve(); // 'largeSum'
     * ```
     */
    mapContext<ContextMapped extends object>(
        mapper: TMatcherContextMapper<Context, ContextMapped>,
    ): IMatcherBranch<Prettify<ContextMapped>, Cases, ParentContext>;

    /**
     * Forwards control to a delegated matcher branch, allowing for encapsulated matching logic.
     *
     * This method is used to offload part of the matching process to a separate matcher
     * branch. It enables custom logic (e.g., parsing, validation, normalization)
     * to be handled before continuing the main matcher chain.
     *
     * The delegated matcher can transform the context and produce its own set of result cases,
     * which are then merged back into the main matcher flow.
     *
     * Useful for:
     * - Delegating to reusable matcher configurations (e.g., from JSON or presets)
     * - Parsing or preprocessing context before continuing
     * - Creating nested or scoped matching trees
     *
     * @template ForwardCases - The case result types returned from the delegated matcher.
     * @template ForwardContext - The context type returned from the delegated matcher.
     *
     * @param delegate - A function that receives the current matcher branch and returns a new branch matcher.
     * @returns A new matcher branch with updated context and combined case types.
     */
    forward<ForwardCases extends string, ForwardContext extends object>(
        delegate: TMatcherBranchDelegate<
            Context,
            Cases,
            ForwardCases,
            ForwardContext,
            ParentContext
        >,
    ): IMatcherBranch<
        Prettify<ForwardContext>,
        Cases | ForwardCases,
        ParentContext
    >;

    /**
     * Terminates the current matcher branch and returns the current context.
     *
     * Use this when you want to finish processing the current branch and
     * extract its context as-is.
     *
     * @returns The current context after all branch manipulations.
     */
    unwrap(): Context;

    /**
     * Terminates the current matcher branch and returns a merged context,
     * where the merging logic is defined by the provided delegate function.
     *
     * The delegate function receives two arguments:
     * - `current` — the current branch's context after manipulations;
     * - `origin` — the parent/original context before the current branch's manipulations.
     *
     * Use this overload to implement custom merging or selection logic
     * between the original and current contexts before returning the final result.
     *
     * @template ResultContext The resulting merged context type.
     * @param delegate
     *     Merge delegate function that receives the current and original context
     *     and returns the merged context.
     * @returns The merged context after applying the delegate.
     */
    unwrap<ResultContext extends object>(
        delegate: TMatcherContextMergeDelegate<
            Context,
            ParentContext,
            ResultContext
        >,
    ): ResultContext;

    /**
     * Adds a match case to the matcher using boolean condition.
     *
     * This allows branching into more detailed logic while keeping the matcher chain fluent and expressive.
     *
     * @template Case - The case identifier to be added or returned from the delegate.
     *
     * @param condition - A simple boolean that determines whether the case should match.
     * @param resultCase - The resulting case string or a matcher delegate function.
     * @returns A matcher with an updated set of possible result cases.
     *
     * @example static case
     * matcher()
     *   .matchCase(true, 'debug')
     *   .otherwise('release')
     *   .resolve(); // 'debug'
     *
     * @example with delegate branching
     * matcher({ isActive: true })
     *   .matchCase(true, m =>
     *     m.matchCase(ctx => ctx.isActive, 'confirmed')
     *   )
     *   .otherwise('inactive')
     *   .resolve(); // 'confirmed'
     */
    matchCase<Case extends string>(
        condition: boolean,
        resultCase: Case | TMatcherBranchDelegate<Context, Cases, Case>,
    ): IMatcherBranch<Prettify<Context>, Cases | Case, ParentContext>;

    /**
     * Adds a match case using a structural pattern to match context values.
     *
     * @template Case - The case identifier to be added or returned from the delegate.
     *
     * @param pattern - A partial object structure to match against the context.
     * @param resultCase - The resulting case string or a matcher delegate function.
     * @returns A matcher with an updated set of possible result cases.
     *
     * @example static value check
     * matcher({ role: "admin" })
     *   .matchCase({ role: "admin" }, "access")
     *   .otherwise("deny")
     *   .resolve(); // Returns "access"
     *
     * @example matching value with comparator
     * matcher({ age: 27 })
     *    .matchCase({
     *       age: matcher.number({ min: 18 }),
     *    }, "adult")
     *    .otherwise("young")
     *    .resolve(); // Returns "adult"
     */
    matchCase<Case extends string>(
        pattern: TMatcherContextPattern<Context>,
        resultCase: Case | TMatcherBranchDelegate<Context, Cases, Case>,
    ): IMatcherBranch<Prettify<Context>, Cases | Case, ParentContext>;

    /**
     * Adds a match case using a predicate function to evaluate the context.
     *
     * @template Case - The case identifier to be added or returned from the delegate.
     *
     * @param predicate - A function that returns `true` if the context matches.
     * @param resultCase - The resulting case string or a matcher delegate function.
     * @returns A matcher with an updated set of possible result cases.
     *
     * @example
     * matcher({ age: 19, rights: "free" })
     *   .matchCase(ctx => ctx.age >= 16, branch =>
     *     branch
     *       .matchCase(ctx => ctx.rights === "pro", "full")
     *       .otherwise("basic")
     *   )
     *   .otherwise("child")
     *   .resolve() // Returns "basic"
     */
    matchCase<Case extends string>(
        predicate: TMatcherPredicate<Context>,
        resultCase: Case | TMatcherBranchDelegate<Context, Cases, Case>,
    ): IMatcherBranch<Prettify<Context>, Cases | Case, ParentContext>;

    /**
     * Selects a case based on a value derived from the context.
     *
     * This method enables simple case selection based on primitive values like strings or numbers.
     *
     * @template Case - The selected case identifier.
     * @param selector - A function to extract a value from the context to be used as the result case.
     * @returns A matcher with the extracted case added to the result case set.
     *
     * @example
     * matcher({ name: "alice" })
     *   .selectCase(ctx => ctx.name)
     *   .resolve(); // Returns "alice"
     */
    selectCase<Case extends string>(
        selector: TMatcherSelector<Context, Case>,
    ): IMatcherBranch<Prettify<Context>, Cases | Case, ParentContext>;

    /**
     * Selects a case based on a mapped value from the context.
     *
     * This form allows more flexible case routing using a lookup map.
     * Each entry in the map can point either to a case string or a matcher branch delegate for further branching.
     *
     * @template Case - The resulting case type after map resolution.
     * @template T - The keys returned by the selector function.
     * @param selector - A function to extract a key from the context.
     * @param caseMap - A mapping from keys to result cases or matcher delegates.
     * @returns A matcher with an updated set of possible result cases.
     *
     * @example
     * matcher({ type: "gift" })
     *   .selectCase(ctx => ctx.type, {
     *     gift: "giftCase",
     *     promo: branch => branch.matchCase(...),
     *   })
     *   .resolve(); // Returns "giftCase"
     */
    selectCase<Case extends string, T extends string & {}>(
        selector: TMatcherSelector<Context, T>,
        caseMap: Record<T, Case | TMatcherBranchDelegate<Context, Cases, Case>>,
    ): IMatcherBranch<Prettify<Context>, Cases | Case, ParentContext>;

    /**
     * Defines the fallback case if no other cases match.
     *
     * @param resultCase The default case identifier.
     */
    otherwise<Case extends string>(
        resultCase: Case,
    ): IMatcherBranch<Prettify<Context>, Cases | Case, ParentContext>;
}

/**
 * A delegate function used to define a branching matcher logic.
 *
 * Typically used to create isolated matching branches with their own internal logic,
 * which can update the matching context and result set independently of the parent matcher.
 *
 * @template Context - The original input context type from the parent matcher.
 * @template Cases - The original case result type from the parent matcher.
 * @template BranchCases - The (optional) result type returned from the delegated matcher branch.
 * @template BranchContext - The (optional) updated context type for the delegated branch.
 *
 * @param branch - The current matcher branch based on the original context and cases.
 * @returns A new matcher branch, potentially with its own context and matching outcomes.
 */
export type TMatcherBranchDelegate<
    Context extends object,
    Cases extends string,
    BranchCases extends string = Cases,
    BranchContext extends object = Context,
    ParentContext extends object = Context,
> = (
    branch: IMatcherBranch<Context, Cases>,
) => IMatcherBranch<BranchContext, BranchCases, ParentContext> | BranchContext;

/**
 * The main interface for the pattern matcher.
 * Used for evaluate the match chain and retrieve the resolved output.
 *
 * @template Context - The type of the input context being matched.
 * @template Cases - The resulting type after matching cases.
 */
// @ts-expect-error
// TS gets confused about Context and ParentContext being the same type here.
// It’s safe to ignore — we know they're equal in this matcher implementation
export interface IMatcher<
    Context extends object,
    Cases extends string = undefined,
    OriginContext extends object = Context,
> extends IMatcherBranch<Context, Cases, OriginContext> {
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
        resultMap: Partial<
            Record<Cases, Result | TMatcherResolver<Result, Context, Cases>>
        >,
        fallback: Result | TMatcherResolver<Result, Context, Cases>,
    ): Result;

    // region: Override IMatcherBranch

    withContext<ContextExt extends object | null>(
        ext: ContextExt,
    ): IMatcher<Prettify<TContextMerge<Context, ContextExt>>, Cases, OriginContext>;

    mapContext<ContextMapped extends object>(
        mapper: TMatcherContextMapper<Context, ContextMapped>,
    ): IMatcher<Prettify<ContextMapped>, Cases>;

    forward<ForwardCases extends string, BranchContext extends object>(
        delegate: TMatcherBranchDelegate<
            Context,
            Cases,
            ForwardCases,
            BranchContext
        >,
    ): IMatcher<Prettify<BranchContext>, Cases | ForwardCases, OriginContext>;

    matchCase<Case extends string>(
        condition: boolean,
        resultCase: Case | TMatcherBranchDelegate<Context, Cases, Case>,
    ): IMatcher<Prettify<Context>, Cases | Case, OriginContext>;

    matchCase<Case extends string>(
        pattern: TMatcherContextPattern<Context>,
        resultCase: Case | TMatcherBranchDelegate<Context, Cases, Case>,
    ): IMatcher<Prettify<Context>, Cases | Case, OriginContext>;

    matchCase<Case extends string>(
        predicate: TMatcherPredicate<Context>,
        resultCase: Case | TMatcherBranchDelegate<Context, Cases, Case>,
    ): IMatcher<Prettify<Context>, Cases | Case, OriginContext>;

    selectCase<Case extends string>(
        selector: TMatcherSelector<Context, Case>,
    ): IMatcher<Prettify<Context>, Cases | Case, OriginContext>;

    selectCase<Case extends string, T extends string & {}>(
        selector: TMatcherSelector<Context, T>,
        caseMap: Record<T, Case | TMatcherBranchDelegate<Context, Cases, Case>>,
    ): IMatcher<Prettify<Context>, Cases | Case, OriginContext>;

    otherwise<Case extends string>(
        resultCase: Case,
    ): IMatcher<Prettify<Context>, Cases | Case, OriginContext>;

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
