import { Transcript } from "../evaluate";
import { ST_Closure } from "./ST_Closure";

export class ST_Number {
    value: number;
    constructor(value: number) { this.value = value; }
    toString() { return `${this.value}`; }
    printNl() { Transcript.transcript += `${this.value}\n`; }
    _add(a: ST_Number) { return new ST_Number(this.value + a.value); }
    _sub(a: ST_Number) { return new ST_Number(this.value - a.value); }
    _mul(a: ST_Number) { return new ST_Number(this.value * a.value); }
    _div(a: ST_Number) { return new ST_Number(this.value / a.value); }
    to_do_(to: ST_Number, block: ST_Closure) {
        for (let i = new ST_Number(this.value); i.value <= to.value; ++i.value) {
            block.value_(i);
        }
    }
    to_by_do_(to: ST_Number, by: ST_Number, block: ST_Closure) {
        if (by.value > 0) {
            for (let i = new ST_Number(this.value); i.value <= to.value; i.value += by.value) {
                block.value_(i);
            }
        } else {
            for (let i = new ST_Number(this.value); i.value >= to.value; i.value += by.value) {
                block.value_(i);
            }
        }
    }
    // max
    // min
    // rounded
    // negated
}
