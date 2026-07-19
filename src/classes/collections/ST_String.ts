import { ST_Transcript } from "../ST_Transcript"

export class ST_String {
    value: string
    constructor(value: string) { this.value = value }
    toString() { return this.value }
    _printNl() { ST_Transcript._show_(this.value); ST_Transcript._cr() }
    $comma(a: string) { return new ST_String(this.value + a) }
    //copyFrom: to:
    //reversed
}
