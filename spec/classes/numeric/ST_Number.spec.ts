import { describe, expect, it } from "vitest"
import { ST_Number } from "../../../src/classes/numeric/ST_Number"

// // divide and floor
//   Answer the truncated quotient resulting from dividing the receiver by operand. The truncation is
// towards negative infinity.
//   20 // 3     6
//   -20 // 3   -1
//   20 // 6     3
//   -20 // 6   -4

//   Answer the remainder after integer division of the receiver by the operand.
//   20 \\ 3     2
//   -20 \\ 3    1
//   20 \\ 6     2
//   -20 \\ 6    4

describe("ST_Number", () => {
    describe("//", () => {
        it("9 // 4 = 2", () => {
            expect(new ST_Number(9).$idiv(new ST_Number(4)).value).to.equal(2)
        })
        it("-9 // 4 = 3", () => {
            expect(new ST_Number(-9).$idiv(new ST_Number(4)).value).to.equal(-3)
        })
        it("-0.9 // 0.4 = -3", () => {
            expect(new ST_Number(-0.9).$idiv(new ST_Number(0.4)).value).to.equal(-3)
        })
    })
    describe("\\\\", () => {
        it("9 \\\\ 4 = 1", () => {
            expect(new ST_Number(9).$mod(new ST_Number(4)).value).to.equal(1)
        })
        it("-9 \\\\ 4 = 3", () => {
            expect(new ST_Number(-9).$mod(new ST_Number(4)).value).to.equal(3)
        })
        it("0.9 \\\\ 0.4 = 0.1", () => {
            expect(new ST_Number(0.9).$mod(new ST_Number(0.4)).value).toBeCloseTo(0.1)
        })
    })
})