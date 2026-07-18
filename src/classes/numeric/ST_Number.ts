import { ST_Point } from "../graphics/ST_Point"
import { ST_Transcript } from "../ST_Transcript"

const D = 360 / (2.0 * Math.PI)

export class ST_Number {
    value: number
    constructor(value: number) { this.value = value }
    toString() { return `${this.value}` }
    _printNl() { ST_Transcript._show_(this.value); ST_Transcript._cr() }
    /**
     * Answer the sum of the receiver and aNumber
     */
    $add(a: ST_Number) { return new ST_Number(this.value + a.value) }
    /**
     * Answer the difference between the receiver and aNumber.
     */
    $sub(a: ST_Number) { return new ST_Number(this.value - a.value) }
    /**
     * Answers the result of multiplying the receiver by aNumber.
     */
    $mul(a: ST_Number) { return new ST_Number(this.value * a.value) }
    /**
     * Answer the result of dividing receiver by aNumber
     */
    $div(a: ST_Number) { return new ST_Number(this.value / a.value) }

    $dot(a: ST_Number) { return new ST_Point(this, a) }

    /**
     * Integer quotient defined by division with truncation toward negative
     * infinity. 9//4 = 2, -9//4 = -3, -0.9//0.4 = -3
     */
    // FIXME: ^(self / aNumber) floor
    $mod(a: ST_Number) { return new ST_Number(this.value % a.value) }
    /**
     * Create an ...
     */
    _to_do_(to: ST_Number, block: Function) {
        for (let i = new ST_Number(this.value); i.value <= to.value; ++i.value) {
            (block as any)._value_(i)
        }
    }
    _to_by_do_(to: ST_Number, by: ST_Number, block: Function) {
        if (by.value > 0) {
            for (let i = new ST_Number(this.value); i.value <= to.value; i.value += by.value) {
                (block as any)._value_(i)
            }
        } else {
            for (let i = new ST_Number(this.value); i.value >= to.value; i.value += by.value) {
                (block as any)._value_(i)
            }
        }
    }
    // max
    // min
    // rounded
    // negated
    _degreesToRadians() { return new ST_Number(this.value / D) }
    _cos() { return new ST_Number(Math.cos(this.value)) }
    _sin() { return new ST_Number(Math.sin(this.value)) }
}
