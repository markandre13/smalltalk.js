import type { ST_String } from "../collections/ST_String"

/**
 * Manages Smalltalk's global variables.
 *
 * Since we compile to Javascript, Smalltalks global variables also need to be
 * available globally and therefore at stored inside (window|global).st.
 */
export class SystemDictionary {
    static global: any
    constructor() {
        const g = globalThis as any
        g.st = {}
        SystemDictionary.global = g.st
    }

    _at_put_(aKey: ST_String | string, anObject: any) {
        // console.log(`SystemDictionary at: ${aKey} put: ${anObject}`)
        if (typeof aKey === "string") {
            SystemDictionary.global[aKey] = anObject
        } else {
            SystemDictionary.global[aKey.value] = anObject
        }
    }
    _at_(aKey: ST_String): any {
        return SystemDictionary.global[aKey.value]
    }
    static at(aKey: string) {
        return this.global[aKey]
    }
    static atPut(aKey: string, anObject: any) {
        this.global[aKey] = anObject
    }
}
