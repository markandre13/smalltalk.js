//
// runtime support
//

import { ST_Array } from "./classes/ST_Array"
import { ST_Number } from "./classes/ST_Number"
import { ST_Pen } from "./classes/ST_Pen"
import { ST_Point } from "./classes/ST_Point"
import { ST_Scope } from "./classes/ST_Scope"
import { ST_Transcript } from "./classes/ST_Transcript"

const smalltalkMethodNameToJsMethodName = new Map<string, string>([
    ["+", "_add"],
    ["-", "_sub"],
    ["*", "_mul"],
    ["/", "_div"],
    ["@", "_dot"],
    ["<", "_l"],
    ["<=", "_lt"],
    [">", "_gt"],
    [">=", "_gw"],
    ["=", "_eq"],
    ["~=", "_ne"],
    // //
    // \\
])

/**
 * convert smalltalk method name into javascript one
 */
export function st_method_name(s: string): string {
    const name = smalltalkMethodNameToJsMethodName.get(s)
    if (name !== undefined) {
        return name
    }
    return s.replace(/:/g, "_")
}

export function makeGlobalScope() {
    const scope = new ST_Scope()
    scope.set("Array", ST_Array)
    scope.set("Number", ST_Number)
    scope.set("Pen", ST_Pen)
    scope.set("Point", ST_Point)
    scope.set("Transcript", ST_Transcript)
    return scope
}
