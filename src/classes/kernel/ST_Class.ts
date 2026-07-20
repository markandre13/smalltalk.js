import type { ST_String } from "../collections/ST_String"
import { ClassCategoryReader } from "./ClassCategoryReader"
import { ST_ClassDescription } from "./ST_ClassDescription"
import { ST_MetaClass } from "./ST_MetaClass"

// Every object is an instance of a class. ???
// does it have a reference to it's MetaClass?

export class ST_Class extends ST_ClassDescription {
    name?: string
    classPool: any // stores all class variables
    sharedPools: any
    $class: ST_MetaClass
    constructor() {
        super()
        this.$class = new ST_MetaClass()
        this.$class.thisClass = this
    }

    _class() {
        return this.$class
    }

    _name() {
        return this.name
    }
    /**
     * Answer a ClassCategoryReader for accessing the messages in the method
     * dictionary category, aString, of the receiver.
     */
    _methodsFor_(aString: ST_String) {
        // console.log(`Class methodsFor: ${aString}`)
        // ^ClassCategoryReader class: self category: aString asSymbol
        return new ClassCategoryReader(this, aString)
    }
}
