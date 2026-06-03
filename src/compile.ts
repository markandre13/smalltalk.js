/**
 * transpile the smalltalk parse tree to javascript
 */

import { ST_Array } from "./classes/ST_Array"
import { ST_Scope } from "./classes/ST_Scope"
import { makeGlobalScope, st_method_name } from "./evaluate"
import type { Node } from "./node"
import { Type } from "./type"

export function cascade_messages(primary: any, ...arg: ((it: any) => any)[]) {
    let result = primary
    for (const c of arg) { result = c(primary) }
    return result
}

// TODO: we actually want to match the lines of the output to the input

export function compile(node: Node | undefined, scope: ST_Scope = makeGlobalScope()): string {
    if (node === undefined) {
        return "undefined"
    }
    // console.log(`compile(${node})`)

    switch (node.type) {
        case Type.SYN_INITIALIZER_DEFINITION: {
            const s = new ST_Scope(scope)
            let r = ''
            for (const n of node.child) {
                if (n !== undefined) {
                    r += compile(n, s) + ';'
                }
            }
            return r
        }
        case Type.SYN_TEMPORARIES: {
            for (const n of node.child) {
                scope.init(n!.text!, null)
            }
            return `let ${node.child.map(it => it!.text).join(",")}`
        }
        case Type.SYN_BLOCK_ARGUMENTS: {
            for (const n of node.child) {
                scope.init(n!.text!, null)
            }
            return `${node.child.map(it => it!.text).join(",")}`
        }
        case Type.SYN_STATEMENTS: {
            // TODO: test me
            let r = ''
            for (let i = 0; i < node.child.length - 1; ++i) {
                r += compile(node.child[i], scope) + ';'
            }
            r += "return " + compile(node.child[node.child.length - 1], scope)
            return r
        }
        case Type.SYN_EXPRESSION: {
            let result = compile(node.child[0]!, scope)
            // console.log(`RESULT: ${result}`)
            if (result === undefined) {
                throw Error(`failed to resolve ${node.child[0]}`)
            }
            if (result === null) {
                throw Error(`'${node.child[0]?.text}' is null`)
            }
            if (node.child.length === 1) {
            } else if (node.child.length === 2) {
                // console.log('NO CASCADE')
                for (let n of node.child[1]!.child) {
                    result = compileMessage(result, n!, scope)
                }
            } else {
                // see NCITS J20 DRAFT of ANSI Smalltalk Standard rev1.9: 3.4.5.3.3 Cascades
                // console.log('CASCADE')
                // build primary
                const pn = node.child[1]!.child
                let arg = result
                for (let i = 0; i < pn.length - 1; ++i) {
                    arg = compileMessage(arg, pn[i]!, scope)
                }
                // console.log(`  PRIMARY: ${arg}`)
                result = `cascade_messages(${arg}`
                // build first message
                arg = compileMessage("$_", pn[pn.length - 1]!, scope)
                // console.log(`  MESSAGE: ${arg}`)
                result += `,($_)=>${arg}`

                // build cascade messages
                for (let i = 2; i < node.child.length; ++i) {
                    arg = "$_"
                    for (let n of node.child[i]!.child) {
                        arg = compileMessage(arg, n!, scope)
                    }
                    // console.log(`  CASCADE: ${arg}`)
                    result += `,($_)=>${arg}`
                }
                result += ")"
                // console.log(`RESULT: ${result}`)
            }
            return result
        }
        case Type.TKN_ASSIGNMENT: {
            return `${node.child[0]!.text}=${compile(node.child[1]!, scope)}`
        }
        case Type.TKN_IDENTIFIER: {
            const a = scope.get(node.text!)
            if (typeof a === "function") {
                return a.name
            }
            // during Type.SYN_TEMPORARIES we've set declared variables to null
            if (a === null) {
                return node.text!
            }
            // FIXME: replace the replaceAll('_', ':') with a proper reverse implementation of st_method_name()
            throw Error(`undeclared identifier ${node.text?.replaceAll('_', ':')}`)
        }
        case Type.TKN_STRING:
            return `new ST_String('${node.text}')` // FIXME: need to esacpe node.text
        case Type.TKN_INTEGER:
            return `new ST_Number(${node.text})`
        case Type.SYN_BLOCK_CLOSURE: {
            let _scope = new ST_Scope(scope)
            let _args: Node | undefined = undefined;
            let _tmps: Node | undefined = undefined;
            let _stmt: Node | undefined = undefined;
            for (let child of node.child) {
                switch (child?.type) {
                    case Type.SYN_BLOCK_ARGUMENTS:
                        _args = child
                        break;
                    case Type.SYN_TEMPORARIES:
                        _tmps = child
                        break;
                    default:
                        _stmt = child
                }
            }
            let r = '('
            if (_args) {
                r += compile(_args, _scope)
            }
            r += ')=>'
            if (_tmps) {
                r += '{'
                r += compile(_tmps, _scope) + ';'
            }
            if (_stmt) {
                if (_stmt.type === Type.SYN_STATEMENTS) {
                    if (_tmps === undefined) {
                        r += '{'
                    }
                    r += `${compile(_stmt, _scope)}}`
                } else {
                    if (_tmps === undefined) {
                        r += compile(_stmt, _scope)
                    } else {
                        r += `return ${compile(_stmt, _scope)}}`
                    }
                }
            } else {
                if (_tmps === undefined) {
                    r += "{"
                }
                r += "}"
            }
            // console.log(`RESULT: ${r}`)
            return r
        }
        case Type.TKN_ARRAY_LITERAL: {
            // node.child.map(it => evaluate(it, scope))
            const array: string[] = []
            for (const e of node.child) {
                array.push(compile(e, scope))
            }
            return `new ST_Array(${array.join(',')})`
        }
    }
    throw Error(`compile(${node.toString()}): not implemented`)
}

function compileMessage(primary: string, node: Node, scope: ST_Scope) {
    const methodName = st_method_name(node.text!)
    switch (node.type) {
        case Type.TKN_IDENTIFIER: // unary
            return `(${primary}).${methodName}()`
        case Type.TKN_BINARY:
        case Type.TKN_KEYWORD: {
            const args = node.child.map(n => compile(n!, scope))
            return `(${primary}).${methodName}(${args.join(',')})`
        }
    }
    throw Error("Not implemented yet")
}