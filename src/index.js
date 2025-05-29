// Package: @spirex/matcher
// Copyright 2025 (c) Artem Sobolenkov
// MIT License
// https://github.com/spirex64

export function matcher(context) {
    var matchedCase = undefined;

    return {
        matchCase(condition, resultCase) {
            if (condition) matchedCase = resultCase;
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
