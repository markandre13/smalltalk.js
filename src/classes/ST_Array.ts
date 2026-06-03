import type { ST_Number } from "./ST_Number";

export class ST_Array extends Array<any> {
    static new_(arrayLength: ST_Number) {
        return new ST_Array(arrayLength.value);
    }
    at_put_(at: ST_Number, value: any) {
        this[at.value] = value;
        return this;
    }
    at_(at: ST_Number) { return this[at.value]; }
    do_(block: (item: any) => void) { for (const item of this) { block(item) } }
    // with
    // size
    // isEmpty
    // first
    // add
}
