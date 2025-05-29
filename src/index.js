// Package: @spirex/matcher
// Copyright 2025 (c) Artem Sobolenkov
// MIT License
// https://github.com/spirex64

export function matcher(context) {
    var matchedCase = undefined;

    function matchCasePattern(pattern, resultCase) {
        // Null-pattern is always unmatched
        if (!pattern) return;
        var patternKeys = Object.keys(pattern);

        // Empty pattern is always matched
        if (patternKeys.length > 0) {
            var isMatchPattern =
                context &&
                patternKeys.every((key) =>
                    Object.is(context[key], pattern[key]),
                );
            // Context must match given pattern
            if (!isMatchPattern) return;
        }
        matchedCase = resultCase;
    }

    return {
        matchCase(input, resultCase) {
            var inputType = typeof input;

            if (
                (inputType === "boolean" && input) ||
                (inputType === "function" && input(context))
            )
                matchedCase = resultCase;
            else if (inputType === "object")
                matchCasePattern(input, resultCase);

            return this;
        },

        otherwise(resultCase) {
            matchedCase ||= resultCase;
            return this;
        },

        resolve() {
            return matchedCase;
        },
    };
}
