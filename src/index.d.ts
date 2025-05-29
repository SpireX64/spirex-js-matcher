// Package: @spirex/matcher
// Copyright 2025 (c) Artem Sobolenkov
// MIT License
// https://github.com/spirex64

export type TMatcherPredicate<Context extends object> = (
    context: Context,
) => boolean;

export type TContextMerge<
    A extends object,
    B extends object | null = null,
> = B extends null ? A : Omit<A, keyof B> & B;

export interface IMatcher<
    Context extends object,
    Cases extends string = undefined,
> {
    withContext<ContextExt extends object | null>(
        ext: ContextExt,
    ): IMatcher<TContextMerge<Context, ContextExt>, Cases>;

    matchCase<Case extends string>(
        condition: boolean,
        resultCase: Case,
    ): IMatcher<Context, Cases | Case>;

    matchCase<Case extends string>(
        pattern: Partial<Context>,
        resultCase: Case,
    ): IMatcher<Context, Cases | Case>;

    matchCase<Case extends string>(
        predicate: TMatcherPredicate<Context>,
        resultCase: Case,
    ): IMatcher<Context, Cases | Case>;

    otherwise<Case extends string>(
        resultCase: Case,
    ): IMatcher<Context, Cases | Case>;

    resolve(): Cases;

    resolve<Result>(resultMap: Record<Cases, Result>): Result;

    resolve<Result>(resultMap: Partial<Record<Cases, Result>>, fallback: Result): Result;
}

export function matcher<Context extends object = {}>(
    context?: Context,
): IMatcher<Context>;
