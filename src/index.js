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
    var contextStack = [context || {}];

    // region: Context manipulation functions
    var getContext = (index) =>
        contextStack[contextStack.length - (index || 1)];
    var updateContext = (newContext, index) =>
        (contextStack[contextStack.length - (index || 1)] = newContext);
    // endregion

    function applyMatchedCase(caseOrBranch) {
        if (typeof caseOrBranch === "function") {
            // Branch forwarding
            contextStack.push({ ...getContext() });
            caseOrBranch(this);
            contextStack.pop();
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
            var currentContext = getContext();
            var isMatchPattern = patternKeys.every((key) => {
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
            if (ext) updateContext(Object.assign({}, getContext(), ext));
            return this;
        },

        mapContext(mapper) {
            updateContext(mapper(getContext()));
            return this;
        },

        forward(delegate) {
            if (!matchedCase) {
                applyMatchedCase.apply(this, [delegate]);
            }
            return this;
        },

        unwrap(delegate) {
            var isBranch = contextStack.length > 1;
            var originContextIndex = isBranch ? 2 : 1;
            var newContext = getContext();
            if (delegate) {
                newContext = delegate(
                    newContext,
                    isBranch ? getContext(originContextIndex) : context,
                );
            }
            return updateContext(newContext, originContextIndex);
        },

        matchCase(input, resultCase) {
            // Skip, if matched case was found
            if (!matchedCase) {
                var inputType = typeof input;
                if (
                    (inputType === "boolean" && input) ||
                    (inputType === "function" && input(getContext()))
                ) {
                    applyMatchedCase.apply(this, [resultCase]);
                } else if (inputType === "object")
                    matchCasePattern.apply(this, [input, resultCase]);
            }
            return this;
        },

        selectCase(selector, caseMap) {
            // Skip, if matched case was found
            if (matchedCase) return this;
            var caseKey = selector(getContext());
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
                ? resultOrDelegate(getContext(), matchedCase)
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
