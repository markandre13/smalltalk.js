import type { ST_Number } from "./ST_Number";

export class ST_Array<T> extends Array<T> {
    static new_(arrayLength: ST_Number) {
        return new ST_Array(arrayLength.value);
    }
    at_put_(at: ST_Number, value: any) {
        this[at.value] = value;
        return this;
    }
    at_(at: ST_Number) { return this[at.value]; }

    // with
    // size
    // isEmpty
    // first
    // add
}
