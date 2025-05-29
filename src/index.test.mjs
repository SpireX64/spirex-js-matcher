import { describe, test, expect } from "vitest";
import { matcher } from "./index";

describe("@spirex/matcher", () => {
    describe("Create matcher", () => {
        test("WHEN: empty matcher", () => {
            // Act -------------
            var m = matcher();

            // Assert ----------
            expect(m).toBeInstanceOf(Object);
        });

        test("WHEN: initial context", () => {
            // Arrange ------
            var ctx = { foo: 42 }

            // Act ----------
            var m = matcher(ctx);

            // Assert -------
            expect(m).toBeInstanceOf(Object);
            expect(m).not.toBe(ctx);
        })
    });
});
