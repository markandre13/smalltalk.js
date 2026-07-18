import type { ST_String } from "../ST_String"
import { SystemDictionary } from "../SystemDictionary"
import { ST_Class } from "./ST_Class"

export class ST_Object {
    static _subclass_instanceVariableNames_classVariableNames_poolDictionaries_category_(
        subclass: ST_String,
        instanceVariableNames: ST_String,
        classVariableNames: ST_String,
        poolDictionaries: ST_String,
        category: ST_String
    ) {
        let clazz = new ST_Class()
        clazz.instanceVariables = instanceVariableNames
        clazz.name = subclass.value

        SystemDictionary.atPut(subclass.value, clazz)
    }
}
