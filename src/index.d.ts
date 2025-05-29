// Package: @spirex/matcher
// Copyright 2025 (c) Artem Sobolenkov
// MIT License
// https://github.com/spirex64

type TMatcherPredicate<Context extends object> = (context: Context) => boolean;

interface IMatcher<Context extends object, Cases extends string = never> {
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

    resolve(): Cases extends never ? undefined : Cases;
}

declare function matcher<Context extends object>(
    context?: Context,
): IMatcher<Context>;
