import { ST_String } from "../collections/ST_String"
import { ClassCategoryReader } from "./ClassCategoryReader"
import type { ST_Class } from "./ST_Class"
import { ST_ClassDescription } from "./ST_ClassDescription"

// Every class is an instance of a metaclass.
// ST_MetaClass is not subclassed
// When we want to 'Object subclass: #Point'
// we also 
export class ST_MetaClass extends ST_ClassDescription {
    /**
     * thisClass <Class> the chief instance of me, which I describe
     */
    thisClass?: ST_Class

    _methodsFor_(aString: ST_String) {
        // console.log(`Class methodsFor: ${aString}`)
        // ^ClassCategoryReader class: self category: aString asSymbol
        return new ClassCategoryReader(this, aString)
    }

    /** 
     * Answer a String that is the name of the receiver, either Metaclass or the
     * name of the receiver's class followed by the ' class'.
     */
    name_() {
        if (this.thisClass === undefined) {
            return new ST_String("a Metaclass")
        } else {
            return new ST_String(`${this.thisClass._name()} class`)
        }
    }
}
