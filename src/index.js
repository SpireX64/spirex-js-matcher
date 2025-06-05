// Package: @spirex/matcher
// Copyright 2025 (c) Artem Sobolenkov
// MIT License
// https://github.com/spirex64

function checkIsComparator(value) {
    return (
        value && typeof value === "object" && typeof value.test === "function"
    );
}

export function matcher(context) {
    var matchedCase = undefined;
    var currentContext = context;

    function applyMatchedCase(caseOrBranch) {
        if (typeof caseOrBranch === "function") {
            // Branch forwarding
            caseOrBranch(this);
        } else {
            // Set matched case
            matchedCase = caseOrBranch;
        }
    }

    function matchCasePattern(pattern, resultCase) {
        // Null-pattern is always unmatched
        if (!pattern) return;
        var patternKeys = Object.keys(pattern);

        // Empty pattern is always matched
        if (patternKeys.length > 0) {
            var isMatchPattern =
                currentContext &&
                patternKeys.every((key) => {
                    var valuePattern = pattern[key];
                    return checkIsComparator(valuePattern)
                        ? valuePattern.test(currentContext[key])
                        : Object.is(currentContext[key], valuePattern);
                });
            // Context must match given pattern
            if (!isMatchPattern) return;
        }
        applyMatchedCase.apply(this, [resultCase]);
    }

    return {
        withContext(ext) {
            if (ext) currentContext = { ...currentContext, ...ext };
            return this;
        },

        mapContext(mapper) {
            currentContext = mapper(currentContext);
            return this;
        },

        forward(delegate) {
            return matchedCase ? this : delegate(this);
        },

        matchCase(input, resultCase) {
            // Skip, if matched case was found
            if (matchedCase) return this;

            var inputType = typeof input;
            if (
                (inputType === "boolean" && input) ||
                (inputType === "function" && input(currentContext))
            ) {
                applyMatchedCase.apply(this, [resultCase]);
            } else if (inputType === "object")
                matchCasePattern.apply(this, [input, resultCase]);

            return this;
        },

        selectCase(selector, caseMap) {
            // Skip, if matched case was found
            if (matchedCase) return this;
            var caseKey = selector(currentContext);
            if (caseKey) {
                if (caseMap) {
                    caseKey = caseMap[caseKey];
                    if (caseKey) applyMatchedCase.apply(this, [caseKey]);
                } else {
                    matchedCase = caseKey;
                }
            }
            return this;
        },

        otherwise(resultCase) {
            matchedCase ||= resultCase;
            return this;
        },

        resolve(resultMap, fallback) {
            if (!resultMap) return matchedCase;
            var resultOrDelegate = resultMap[matchedCase] || fallback;
            return typeof resultOrDelegate === "function"
                ? resultOrDelegate(currentContext, matchedCase)
                : resultOrDelegate;
        },
    };
}

Object.assign(matcher, {
    number: (options) => ({
        test: (value) => {
            if (typeof value !== "number") return false;
            if (options) {
                if (options.min !== undefined && value < options.min)
                    return false;
                if (options.max !== undefined && value > options.max)
                    return false;
                if (options.integer && !Number.isInteger(value)) return false;
                if (options.finite && !Number.isFinite(value)) return false;
            }
            return true;
        },
    }),

    string: (options) => ({
        test: (value) => {
            if (typeof value !== "string") return false;
            if (options) {
                if (
                    options.minLen !== undefined &&
                    value.length < options.minLen
                )
                    return false;
                if (
                    options.maxLen !== undefined &&
                    value.length > options.maxLen
                )
                    return false;
                if (
                    options.pattern !== undefined &&
                    !(
                        options.pattern instanceof RegExp &&
                        options.pattern.test(value)
                    )
                )
                    return false;
            }
            return true;
        },
    }),
});
