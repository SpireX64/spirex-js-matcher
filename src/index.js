// Package: @spirex/matcher
// Copyright 2025 (c) Artem Sobolenkov
// MIT License
// https://github.com/spirex64

export function matcher(context) {
    var matchedCase = undefined;
    var currentContext = context;

    function matchCasePattern(pattern, resultCase) {
        // Null-pattern is always unmatched
        if (!pattern) return;
        var patternKeys = Object.keys(pattern);

        // Empty pattern is always matched
        if (patternKeys.length > 0) {
            var isMatchPattern =
                currentContext &&
                patternKeys.every((key) =>
                    Object.is(currentContext[key], pattern[key]),
                );
            // Context must match given pattern
            if (!isMatchPattern) return;
        }
        matchedCase = resultCase;
    }

    return {
        withContext(ext) {
            if (ext) currentContext = { ...currentContext, ...ext };
            return this;
        },

        matchCase(input, resultCase) {
            var inputType = typeof input;

            if (
                (inputType === "boolean" && input) ||
                (inputType === "function" && input(currentContext))
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

        resolve(resultMap) {
            return resultMap ? resultMap[matchedCase] : matchedCase;
        },
    };
}
