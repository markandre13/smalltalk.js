/**
 * transpile the smalltalk parse tree to javascript
 */

import { ST_Scope } from "./classes/ST_Scope"
import { makeGlobalScope, st_method_name } from "./evaluate"
import type { Node } from "./node"
import { Type } from "./type"

// TODO: we actually want to match the lines of the output to the input

export function compile(node: Node | undefined, scope: ST_Scope = makeGlobalScope()): string {
    if (node === undefined) {
        return "undefined"
    }
    // console.log(`compile(${node})`)

    switch (node.type) {
        case Type.SYN_METHOD_DEFINITION:
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
        case Type.SYN_MESSAGE_PATTERN: {
            for (const n of node.child) {
                if (n?.type === Type.TKN_IDENTIFIER) {
                    scope.init(n!.text!, null)
                }
            }
            return ''
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
        case Type.TKN_RETURN: {
            return compile(node.child[node.child.length - 1], scope)
        }
        case Type.SYN_MESSAGES: {
            // FIXME: 
            if (node.child.length !== 2) {
                throw Error('')
            }
            return `${compile(node.child[0]!, scope)}.${compile(node.child[1]!, scope)}`
        }
        case Type.SYN_EXPRESSION: {
            return compileExpression(node, scope)
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
            if (a !== undefined) {
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
            let _args: Node | undefined = undefined
            let _tmps: Node | undefined = undefined
            let _stmt: Node | undefined = undefined
            for (let child of node.child) {
                switch (child?.type) {
                    case Type.SYN_BLOCK_ARGUMENTS:
                        _args = child
                        break
                    case Type.SYN_TEMPORARIES:
                        _tmps = child
                        break
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
                if (_stmt.child.length > 1) {
                    if (_tmps === undefined) {
                        r += '{'
                    }
                    r += `${compile(_stmt, _scope)}}`
                } else {
                    if (_tmps === undefined) {
                        if (_stmt.child.length > 1) {
                            r += compile(_stmt, _scope)
                        } else {
                            r += compile(_stmt.child[0], _scope)
                        }
                    } else {
                        r += `${compile(_stmt, _scope)}}`
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
        case Type.SYN_UNARY: // unary
            return primary[0] === '('
                ? `${primary}.${methodName}()`
                : `(${primary}).${methodName}()`
        case Type.TKN_BINARY:
        case Type.TKN_KEYWORD: {
            const args = node.child.map(n => compile(n!, scope))
            return primary[0] === '('
                ? `${primary}.${methodName}(${args.join(',')})`
                : `(${primary}).${methodName}(${args.join(',')})`
        }
    }
    throw Error("Not implemented yet")
}

function compileExpression(node: Node, scope: ST_Scope): string {
    let result = compile(node.child[0]!, scope)
    // console.log(`RESULT: ${result}`)
    if (result === undefined) {
        throw Error(`failed to resolve ${node.child[0]}`)
    }
    if (result === null) {
        throw Error(`'${node.child[0]?.text}' is null`)
    }
    if (node.child.length === 1) {
        return result
    } else if (node.child.length === 2) {
        // console.log('NO CASCADE')
        for (let n of node.child[1]!.child) {
            result = compileMessage(result, n!, scope)
        }
        return result
    } else {
        // see NCITS J20 DRAFT of ANSI Smalltalk Standard rev1.9: 3.4.5.3.3 Cascades

        // assignment
        // let a;{let _tmp=1;_tmp+2;a=_tmp+3}
        // return ...
        // {let _tmp=1;_tmp+2;return _tmp+3}
        // statement
        // {let _tmp=1;_tmp+2;_tmp+3}

        for (let n of node.child[1]!.child) {
            result = compileMessage(result, n!, scope)
        }
        result = `let _tmp=${result}`
        for (let i = 2; i < node.child.length; ++i) {
            let cascadedMsg = '_tmp'
            for (let n of node.child[i]!.child) {
                cascadedMsg = compileMessage(cascadedMsg, n!, scope)
            }
            result += ';' + cascadedMsg
        }
        return `{${result}}`
    }
}