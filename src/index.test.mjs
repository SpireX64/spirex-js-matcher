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
    });
});
