import { ST_Array } from "./classes/ST_Array"
import { ST_Number } from "./classes/ST_Number"
import { ST_Pen } from "./classes/ST_Pen"
import { ST_Point } from "./classes/ST_Point"
import { ST_String } from "./classes/ST_String"
import { ST_Transcript } from "./classes/ST_Transcript"
import { SystemDictionary } from "./classes/SystemDictionary"

/**
 * setup the global environment to execute smalltalk
 */
export function initialize() {

    const dict = new SystemDictionary()
    dict._at_put_("Smalltalk", dict)
    dict._at_put_("Array", ST_Array)
    dict._at_put_("Number", ST_Number)
    dict._at_put_("Pen", ST_Pen)
    dict._at_put_("Point", ST_Point)
    dict._at_put_("String", ST_String)
    dict._at_put_("Transcript", ST_Transcript)

    // st.nil = {
    //     "subclass_instanceVariableNames_classVariableNames_poolDictionaries_category_": (
    //         subclass: string,
    //         instanceVariableNames: string,
    //         classVariableNames: string,
    //         poolDictionaries: string,
    //         category: string
    //     ) => {
    //         console.log(`nil subclass: #${subclass} instanceVariableNames: '${instanceVariableNames}' ...`)
    //     }
    // }

    const f = Function.prototype as any
    const h = new Function('...args', 'return this.apply(this, args)')
    f._value = h
    f._value_ = h
    f._value_value_ = h
    f._value_value_value_ = h
    f._value_value_value_value_ = h
    f._value_value_value_value_value_ = h
    f._value_value_value_value_value_value_ = h
    f._value_value_value_value_value_value_value_ = h
    f._value_value_value_value_value_value_value_value_ = h
}
