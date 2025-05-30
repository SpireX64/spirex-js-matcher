import { vi, describe, test, expect } from "vitest";
import { matcher } from "./index";

var trueCase = "trueCase";
var falseCase = "falseCase";

describe("Matcher", () => {
    describe("Create matcher", () => {
        test("WHEN: empty matcher", () => {
            // Act -------------
            var m = matcher();

            // Assert ----------
            expect(m).toBeInstanceOf(Object);
        });

        test("WHEN: initial context", () => {
            // Arrange ------
            var ctx = { foo: 42 };

            // Act ----------
            var m = matcher(ctx);

            // Assert -------
            expect(m).toBeInstanceOf(Object);
            expect(m).not.toBe(ctx);
        });
    });

    describe("Chaining", () => {
        test("WHEN: Chain match case with boolean argument", () => {
            // Arrange ------
            var m = matcher();

            // Act ----------
            var result = m.matchCase(true, "key");

            // Assert -------
            // Returns the same matcher for chaining
            expect(result).toBe(m);
        });

        test("WHEN: Chain with predicate function", () => {
            // Arrange ------
            var m = matcher();

            // Act ----------
            var result = m.matchCase(() => true, "key");

            // Assert -------
            // Returns the same matcher for chaining
            expect(result).toBe(m);
        });

        test("WHEN: Chain with object pattern", () => {
            // Arrange ------
            var m = matcher();

            // Act ----------
            var result = m.matchCase({ foo: "bar" }, "key");

            // Assert -------
            // Returns the same matcher for chaining
            expect(result).toBe(m);
        });

        test("WHEN: Chain with selector", () => {
            // Arrange -------
            var m = matcher();

            // Act --------
            var result = m.selectCase(() => "key");

            // Assert -----
            // Returns the same matcher for chaining
            expect(result).toBe(m);
        });

        test("WHEN: Chain otherwise", () => {
            // Arrange -----
            var m = matcher();

            // Act ---------
            var result = m.otherwise("key");

            // Assert ------
            // Returns the same matcher for chaining
            expect(result).toBe(m);
        });
    });

    describe("Context mutation", () => {
        test("WHEN: extend context with null", () => {
            // Arrange ------
            var originContext = { foo: 11 };
            var m = matcher(originContext)
                .withContext(null)
                .matchCase((ctx) => ctx.foo === originContext.foo, trueCase)
                .otherwise(falseCase);

            // Act ----------
            var result = m.resolve();

            // Assert -------
            // Context was not erased
            expect(result).toBe(trueCase);
        });

        test("WHEN: extend context with new property", () => {
            // Arrange ------
            var originContext = { foo: 11 };
            var extContext = { bar: 22 };

            var m = matcher(originContext)
                .withContext(extContext)
                .matchCase({ foo: 11, bar: 22 }, trueCase)
                .otherwise(falseCase);

            // Act ----------
            var result = m.resolve();

            // Assert -------
            expect(result).toBe(trueCase);
        });

        test("WHEN: mutate value in context", () => {
            // Arrange -------
            var originContext = { foo: "bar" };
            var extContext = { foo: "qwe" };

            var m = matcher(originContext)
                .withContext(extContext)
                .matchCase({ foo: "qwe" }, trueCase)
                .otherwise(falseCase);

            // Act -----------
            var result = m.resolve();

            // Assert --------
            expect(result).toBe(trueCase);
        });
    });

    describe("Resolve", () => {
        test("WHEN: empty matcher", () => {
            // Arrange --------
            var m = matcher();

            // Act ------------
            var result = m.resolve();

            // Assert ---------
            expect(result).toBeUndefined();
        });

        test("WHEN: only otherwise", () => {
            // Arrange --------
            var expectedCase = "key";
            var m = matcher().otherwise(expectedCase);

            // Act ------------
            var result = m.resolve();

            // Assert ---------
            // Returns case-key passed to otherwise branch
            expect(result).toBe(expectedCase);
        });

        describe("Match case", () => {
            describe("Boolean matching", () => {
                test.each([true, false])(
                    "WHEN: pass boolean (%s)",
                    (condition) => {
                        // Arrange --------
                        var m = matcher()
                            .matchCase(condition, trueCase)
                            .otherwise(falseCase);

                        // Act ------------
                        var result = m.resolve();

                        // Assert ---------
                        expect(result).toBe(condition ? trueCase : falseCase);
                    },
                );
            });

            describe("Predicate", () => {
                test.each([
                    [true, trueCase],
                    [false, falseCase],
                ])(
                    "WHEN: predicate returns %s",
                    (predicateResult, expectedCase) => {
                        // Arrange ---------
                        var context = { foo: 42 };
                        var predicate = vi.fn(() => predicateResult);
                        var m = matcher()
                            .matchCase(predicate, trueCase)
                            .otherwise(falseCase);

                        // Act -------------
                        var result = m.resolve();

                        // Assert ----------
                        expect(result).toBe(expectedCase);
                        expect(predicate).toHaveBeenCalled(context);
                    },
                );
            });

            describe("Object pattern", () => {
                test.each([
                    // Any context matches empty pattern (exclude null-pattern)
                    ["without context", undefined],
                    ["with empty context", {}],
                    ["with context", { foo: "bar" }],
                ])("WHEN: pass empty pattern, %s", (_, context) => {
                    // Arrange --------
                    var m = matcher(context)
                        .matchCase({}, trueCase)
                        .otherwise(falseCase);

                    // Act ------------
                    var result = m.resolve();

                    // Assert ----
                    // Undefined context matches empty pattern
                    expect(result).toBe(trueCase);
                });

                test.each([
                    // Null-pattern is always unmatched
                    ["without context", undefined],
                    ["with empty context", {}],
                    ["with context", { foo: "bar" }],
                ])("WHEN: pass null pattern, %s", (_, context) => {
                    // Arrange -------
                    var m = matcher(context)
                        .matchCase(null, trueCase)
                        .otherwise(falseCase);

                    // Act -----------
                    var result = m.resolve();

                    // Assert --------
                    expect(result).toBe(falseCase);
                });

                test("WHEN: pass truthy pattern for context", () => {
                    // Arrange ---------
                    var m = matcher({ foo: 42 })
                        .matchCase({ foo: 42 }, trueCase)
                        .otherwise(falseCase);

                    // Act --------------
                    var result = m.resolve();

                    // Assert -----------
                    expect(result).toBe(trueCase);
                });

                test("WHEN: pass falsy pattern for context", () => {
                    // Arrange ---------
                    var m = matcher({ foo: 42 })
                        .matchCase({ foo: 11 }, trueCase)
                        .otherwise(falseCase);

                    // Act --------------
                    var result = m.resolve();

                    // Assert -----------
                    expect(result).toBe(falseCase);
                });
            });
        });

        describe("Select case", () => {
            test("WHEN: Take case from identity", () => {
                // Arrange ------
                var m = matcher()
                    .selectCase(() => trueCase)
                    .otherwise(falseCase);

                // Act ----------
                var result = m.resolve();

                // Assert -------
                expect(result).toBe(trueCase);
            });

            test("WHEN Take undefined case from identity", () => {
                // Arrange ------
                var m = matcher()
                    .selectCase(() => undefined)
                    .otherwise(falseCase);

                // Act ----------
                var result = m.resolve();

                // Assert -------
                expect(result).toBe(falseCase);
            });

            test("WHEN: Take case from context value", () => {
                // Arrange -------
                var m = matcher({ caseKey: "bar" }).selectCase(
                    (c) => c.caseKey,
                );

                // Act -----------
                var result = m.resolve();

                // Assert --------
                expect(result).toBe("bar");
            });

            test("WHEN: Take case by case mapping", () => {
                // Arrange ------
                var m = matcher({ key: "bar" }).selectCase((c) => c.key, {
                    foo: "case1",
                    bar: "case2",
                    qwe: "case3",
                });

                // Act ----------
                var result = m.resolve();

                // Assert -------
                expect(result).toBe("case2");
            });

            test("WHEN: Take case by case mapping fallback", () => {
                var m = matcher({ key: "qwe" })
                    .selectCase((c) => c.key, {
                        foo: "case1",
                        bar: "case2",
                    })
                    .otherwise("case3");

                // Act ----------
                var result = m.resolve();

                // Assert -------
                expect(result).toBe("case3");
            });
        });

        describe("Result case-mapping", () => {
            test("WHEN: map case result", () => {
                // Arrange --------
                var m = matcher({ foo: "bar" })
                    .matchCase({ foo: "qwe" }, "A")
                    .matchCase({ foo: "bar" }, "B")
                    .otherwise("C");

                // Act -------
                var result = m.resolve({ A: 1, B: 2, C: 3 });

                // Assert -----
                expect(result).toBe(2);
            });

            test("WHEN: map case with fallback result", () => {
                // Arrange --------
                var m = matcher({ foo: falseCase })
                    .matchCase({ foo: "qwe" }, "A")
                    .matchCase({ foo: "bar" }, "B")
                    .otherwise(falseCase);

                // Act -------------
                var result = m.resolve({ A: 1, B: 2 }, 0);

                // Arrange ---------
                expect(result).toBe(0);
            });
        });
    });

    describe("Comparators", () => {
        describe("Number comparator", () => {
            test.each([
                ["is number", 42, trueCase],
                ["not is number", "foo", falseCase],
            ])("WHEN: check value type %s", (_, value, expectedCase) => {
                // Arrange --------
                var m = matcher({ value })
                    .matchCase({ value: matcher.number() }, trueCase)
                    .otherwise(falseCase);

                // Act ------------
                var result = m.resolve();

                // Assert ---------
                expect(result).toBe(expectedCase);
            });

            test.each([
                [20, trueCase],
                [5, falseCase],
            ])("WHEN: check value 10 less then %d max", (max, expectedCase) => {
                // Arrange -----

                var m = matcher({ value: 10 })
                    .matchCase({ value: matcher.number({ max }) }, trueCase)
                    .otherwise(falseCase);

                // Act ---------
                var result = m.resolve();

                // Assert ------
                expect(result).toBe(expectedCase);
            });

            test.each([
                [37, trueCase],
                [72, falseCase],
            ])("WHEN: check value 42 more then %d max", (min, expectedCase) => {
                // Arrange -----
                var m = matcher({ value: 42 })
                    .matchCase({ value: matcher.number({ min }) }, trueCase)
                    .otherwise(falseCase);

                // Act ---------
                var result = m.resolve();

                // Assert ------
                expect(result).toBe(expectedCase);
            });

            test.each([
                [32, trueCase],
                [3.14, falseCase],
            ])("WHEN: check value %d is integer", (value, expectedCase) => {
                // Arrange -------
                var m = matcher({ value })
                    .matchCase(
                        { value: matcher.number({ integer: true }) },
                        trueCase,
                    )
                    .otherwise(falseCase);

                // Act --------
                var result = m.resolve();

                // Assert -----
                expect(result).toBe(expectedCase);
            });

            test.each([
                [32, trueCase],
                [3.14, trueCase],
                [Infinity, falseCase],
                [-Infinity, falseCase],
                [NaN, falseCase],
            ])("WHEN: check value %d is finite", (value, expectedCase) => {
                // Arrange -------
                var m = matcher({ value })
                    .matchCase(
                        { value: matcher.number({ finite: true }) },
                        trueCase,
                    )
                    .otherwise(falseCase);

                // Act --------
                var result = m.resolve();

                // Assert -----
                expect(result).toBe(expectedCase);
            });
        });
    });
});
