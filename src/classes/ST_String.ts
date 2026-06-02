import { ST_Transcript } from "./ST_Transcript"

export class ST_String {
    value: string
    constructor(value: string) { this.value = value }
    toString() { return `${this.value}` }
    printNl() { ST_Transcript.show_(this.value); ST_Transcript.cr() }
    _comma(a: string) { return new ST_String(this.value + a) }
    //copyFrom: to:
    //reversed
}
