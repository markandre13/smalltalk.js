import { ST_Closure } from "./ST_Closure"
import { ST_Transcript } from "./ST_Transcript"

const D = 360 / (2.0 * Math.PI)

export class ST_Number {
    value: number
    constructor(value: number) { this.value = value }
    toString() { return `${this.value}` }
    printNl() { ST_Transcript.show_(this.value); ST_Transcript.cr() }
    /**
     * Answer the sum of the receiver and aNumber
     */
    _add(a: ST_Number) { return new ST_Number(this.value + a.value) }
    /**
     * Answer the difference between the receiver and aNumber.
     */
    _sub(a: ST_Number) { return new ST_Number(this.value - a.value) }
    /**
     * Answers the result of multiplying the receiver by aNumber.
     */
    _mul(a: ST_Number) { return new ST_Number(this.value * a.value) }
    /**
     * Answer the result of dividing receiver by aNumber
     */
    _div(a: ST_Number) { return new ST_Number(this.value / a.value) }
    /**
     * Integer quotient defined by division with truncation toward negative
     * infinity. 9//4 = 2, -9//4 = -3, -0.9//0.4 = -3
     */
    // FIXME: ^(self / aNumber) floor
    _mod(a: ST_Number) { return new ST_Number(this.value % a.value) }
    /**
     * Create an ...
     */
    to_do_(to: ST_Number, block: ST_Closure) {
        for (let i = new ST_Number(this.value); i.value <= to.value; ++i.value) {
            block.value_(i)
        }
    }
    to_by_do_(to: ST_Number, by: ST_Number, block: ST_Closure) {
        if (by.value > 0) {
            for (let i = new ST_Number(this.value); i.value <= to.value; i.value += by.value) {
                block.value_(i)
            }
        } else {
            for (let i = new ST_Number(this.value); i.value >= to.value; i.value += by.value) {
                block.value_(i)
            }
        }
    }
    // max
    // min
    // rounded
    // negated
    degreesToRadians() { return new ST_Number(this.value / D) }
    cos() { return new ST_Number(Math.cos(this.value)) }
    sin() { return new ST_Number(Math.sin(this.value)) }
}
