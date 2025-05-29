import { describe, test, expect } from "vitest";
import { matcher } from "./index";

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
            var m = matcher()

            // Act ----------
            var result = m.matchCase(true, 'key')

            // Assert -------
            // Returns the same matcher for chaining
            expect(result).toBe(m);
        })

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
            test.each([true, false])("WHEN: pass boolean (%s)", (condition) => {
                // Arrange --------
                var m = matcher()
                    .matchCase(condition, 'trueCase')
                    .otherwise('falseCase')

                // Act ------------
                var result = m.resolve();

                // Assert ---------
                expect(result).toBe(condition ? "trueCase" : "falseCase");
            })
        })
    });
});
