//
// evaluate
//

import { ST_Array } from "./classes/ST_Array"
import { ST_Closure } from "./classes/ST_Closure"
import { ST_Number } from "./classes/ST_Number"
import { ST_Scope } from "./classes/ST_Scope"
import { ST_String } from "./classes/ST_String"
import type { Node } from "./node"
import { Type } from "./type"

// Transscript
// open
// show:
// cr

// (Boolean methodDictionary at: 'and:') source.

export class Transcript {
    static transcript: string = ""
}

/**
 * convert smalltalk method name into javascript one
 */
function st_method_name(s: string): string {
    if (s === "+") {
        return "_add"
    }
    if (s === "-") {
        return "_sub"
    }
    if (s === "*") {
        return "_mul"
    }
    if (s === "/") {
        return "_div"
    }
    return s.replace(/:/g, "_")
}

export function makeGlobalScope() {
    const scope = new ST_Scope()
    scope.set("Array", ST_Array)
    return scope
}

export function evaluate(node: Node | undefined, scope: ST_Scope = makeGlobalScope()): any {
    if (node === undefined) {
        return undefined
    }
    switch (node.type) {
        case Type.SYN_STATEMENTS: {
            let r: Node | undefined = undefined
            for (let expr of node.child) {
                r = evaluate(expr!, scope)
            }
            return r
        }
        case Type.SYN_EXPRESSION: {
            let primary = evaluate(node.child[0]!, scope)
            if (primary === undefined) {
                throw Error(`failed to resolve ${node.child[0]}`)
            }
            if (primary === null) {
                throw Error(`'${node.child[0]?.text}' is null`)
            }
            let secondary = primary
            for (let i = 1; i < node.child.length; ++i) {
                switch (node.child[i]?.type) {
                    case Type.SYN_MESSAGES: {
                        if (i === 1) {
                            const messages = node.child[i]!.child
                            for (let n of messages) {
                                secondary = primary
                                primary = evaluateMessage(primary, n!, scope)
                            }
                        } else {
                            const messages = node.child[i]!.child
                            primary = secondary
                            for (let n of messages) {
                                primary = evaluateMessage(primary, n!, scope)
                            }
                        }
                    } break
                    default:
                        throw Error("Not implemented yet or wrong.")
                }
            }
            return primary
        }
        case Type.TKN_ASSIGNMENT: {
            const value = evaluate(node.child[1]!, scope)
            scope.set(node.child[0]!.text!, value)
            return value
        }
        case Type.TKN_IDENTIFIER:
            return scope.get(node.text!)
        case Type.TKN_STRING:
            return new ST_String(node.text!)
        case Type.TKN_INTEGER:
            return new ST_Number(parseInt(node.text!))
        case Type.SYN_BLOCK_CLOSURE:
            return new ST_Closure(node, scope)
        case Type.TKN_ARRAY_LITERAL: {
            // node.child.map(it => evaluate(it, scope))
            const array = new ST_Array()
            for (const e of node.child) {
                array.push(evaluate(e, scope))
            }
            return array
        }
    }
    throw Error(`evaluate(${node.toString()}): not implemented`)
}

function evaluateMessage(primary: Node, node: Node, scope: ST_Scope) {
    const methodName = st_method_name(node.text!)
    if (!(methodName in primary)) {
        throw Error(`No method ${node.text!} (${methodName}) in object.`)
    }
    switch (node.type) {
        case Type.TKN_IDENTIFIER: // unary
            return (primary as any)[methodName].call(primary)
        case Type.TKN_BINARY:
        case Type.TKN_KEYWORD: {
            const args = node.child.map(n => evaluate(n!, scope))
            return (primary as any)[methodName].call(primary, ...args)
        }
    }
    throw Error("Not implemented yet")
}
