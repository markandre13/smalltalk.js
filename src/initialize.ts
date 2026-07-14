import { ST_Array } from "./classes/ST_Array"
import { ST_Number } from "./classes/ST_Number"
import { ST_String } from "./classes/ST_String"
import { ST_Transcript } from "./classes/ST_Transcript"

/**
 * setup the global environment to execute smalltalk
 */
export function initialize() {
    let g
    if (typeof window !== "undefined") {
        console.log("Client-side code")
        g = window as any

    } else {
        // console.log("Server-side code")
        g = global as any
    }
    g.ST_Number = ST_Number
    g.ST_String = ST_String
    g.ST_Array = ST_Array
    g.ST_Transcript = ST_Transcript
    const f = Function.prototype as any
    const h = new Function('...args', 'return this.apply(this, args)')
    f.value = h
    f.value_ = h
    f.value_value_ = h
    f.value_value_value_ = h
    f.value_value_value_value_ = h
    f.value_value_value_value_value_ = h
    f.value_value_value_value_value_value_ = h
    f.value_value_value_value_value_value_value_ = h
    f.value_value_value_value_value_value_value_value_ = h
}
