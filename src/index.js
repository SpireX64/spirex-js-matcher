// Package: @spirex/matcher
// Copyright 2025 (c) Artem Sobolenkov
// MIT License
// https://github.com/spirex64

export function matcher(context) {
    var matchedCase = undefined;

    return {
        matchCase(condition, caseKey) {
            if (condition) matchedCase = caseKey;
            return this;
        },

        otherwise(caseKey) {
            matchedCase ||= caseKey;
            return this;
        },

        resolve() {
            return matchedCase;
        },
    };
}
