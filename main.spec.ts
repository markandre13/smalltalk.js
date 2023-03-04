import { expect, it, describe } from "bun:test"
import { Lexer } from "./Lexer"
import { Node } from "./Node"
import { Type } from "./Type"

// TODO
// [ ] classes
// [ ] $char
// [ ] selector
// [ ] #symbol (like strings but unique)
// [ ] true,false,nil
// [ ] array Array new: 27. || #(1 2 3)

// http://ftp.squeak.org/docs/VW/VWChapter3.html#4
//
// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃                 System Browser                ┃
// ┣━━━━━━━━━━━┳━━━━━━━━━━━┳━━━━━━━━━━━┳━━━━━━━━━━━┫
// ┃Categories ┃ Classes   ┃ Protocols ┃ Methods   ┃
// ┃           ┃           ┃           ┃           ┃
// ┃           ┃           ┃           ┃           ┃
// ┃           ┃           ┃           ┃           ┃
// ┃           ┃           ┃           ┃           ┃
// ┃           ┣━━━━━━━━━━━┫           ┃           ┃
// ┃           ┃◉ instance ┃           ┃           ┃
// ┃           ┃◯ class    ┃           ┃           ┃
// ┣━━━━━━━━━━━┻━━━━━━━━━━━┻━━━━━━━━━━━┻━━━━━━━━━━━┫
// ┃ CodeView                                      ┃
// ┃                                               ┃
// ┃                                               ┃
// ┃                                               ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
//
// How To
// o Create new Class
//   o select category (nothing else)
//   o CodeView will display a class template (Squeak 2.2)
//     Object subclass: #NameOfClass
//         instanceVariableNames: 'instVarName1 instVarName2'
//         classVariableNames: 'ClassVarName1 ClassVarName2'
//         poolDictionaries: ''
//         category: 'Collection-Abstract'
// o Show/Edit existing Class 
//   o select category & class
//   o CodeView will show the class definition
//   o edit and use 'Accept' to change it
//   o switch from 'instance' to class and edit class variables:
//     NameOfClass class
//         instanceVariableNames: ''
// o Create new Method
//   o select category, class & protocol (no method)
//   o CodeView will display a method template:
//     message selector and argument names
//         "comment stating purpose of message"
//
//         | temporary variable names |
//         statements
//   o modify template
//   o select 'Accept' from the menu
// o Delete class/method
//   ???

// standard protocols
//   initialize-release
//   accessing
//   testing
//   comparing
//   displaying
//   printing
//   updating
//   private
//   instance-creation

// Inspector
// <obj> inspect.
//
// Object subclass: #MyClass
//   instanceVariableHames: 'testVar' 
//   classVariableNames: '' 
//   poolDictionaries: ''
//   category: 'Test Classes'
//
// or
//
// Object subclass: #Account.
// Account instanceVariableNames: 'balance'.
// Account comment: 'I represent a place to deposit and withdraw money'

// GNU Smalltalk also offers this alternative way to describe objects:
// Object subclass: Account [
//     | balance |
//     <comment: 'I represent a place to deposit and withdraw money'>
//     Account class >> new [
//         | r |
//         <category: 'instance creation'>
//         r := super new.
//         r init.
//         ^r
//    ]
//    init [
//        <category: 'initialization'>
//        balance := 0
//    ]
// ]
//
// Account extend [
//     <comment: 'I represent a place to withdraw money that has been deposited'>
// ]
//
// VisualWorks and Amber use
// !Object methodsFor 'category'!
// methodName
//     "comment"
//     statements!


// Magnitude


// TAASOF: ch8: The Dependency Mechanism

// GNU SmallTask Kernel

// Bag class >> new [

// ]


// Class comment
// Object

let lexer: Lexer

function trace(name: string) {
    // console.log(name)
}

// Grammer is based on
// NCITS J20 DRAFT of ANSI Smalltalk Standard; December, 1996; revision 1.9

// hand-coded recursive-descent parser for Smalltalk (which is LL(1))

// 3.3.1
// <<Smalltalk program>> ::= <<program element>>+ <<initialization ordering>> 
// <<program element>> ::= <<class definition>> |
// <<global definition>> |
// <<pool definition>> |
// <<program initializer definition>>

// 3.3.5
// <<program initializer definition >> ::= <initializer definition>
function program(): Node | undefined {
    return initializer_definition()
}

// 3.4.2
// <method definition> ::= <message pattern> [<temporaries> ] [<statements>]
// <message pattern> ::= <unary pattern> | <binary pattern> | <keyword pattern>
// <unary pattern> ::= unarySelector
// <binary pattern> ::= binarySelector <method argument>
// <keyword pattern> ::= (keyword <method argument>)+

// <temporaries> ::= '|' <temporary variable list> '|' 
// <temporary variable list> ::= identifier*
function temporaries(): Node | undefined {
    let temporaries: Node | undefined = undefined

    const t0 = lexer.lex()
    if (t0?.text !== '|') {
        lexer.unlex(t0)
        return temporaries
    }

    while (true) {
        const id = identifier()
        if (id === undefined) {
            break
        }
        if (temporaries === undefined) {
            temporaries = new Node(Type.SYN_TEMPORARIES)
        }
        temporaries.append(id)
    }

    const t1 = lexer.lex()
    if (t1?.text !== '|') {
        throw Error(`expected '|' after temporaries declaration '|' identifier* but got ${t1}`)
    }

    return temporaries
}

// 3.4.3 Initilizer Definition
// <initializer definition> ::= [<temporaries>] [<statements>]
function initializer_definition(): Node | undefined {
    return statements()
}

// 3.4.4 Blocks
// <block constructor> ::= '[' <block body> ']'
// <block body> ::= [<block argument>* '|'] [<temporaries>] [<statements>]
// <block argument> ::= ':' identifier
function block_constructor(): Node | undefined {
    const left_bracket = lexer.lex()
    if (left_bracket?.type !== Type.TKN_LEFT_SQUARE_BRACKET) {
        lexer.unlex(left_bracket)
        return undefined
    }
    const body = block_body()
    const right_bracket = lexer.lex()
    if (right_bracket?.type !== Type.TKN_RIGHT_SQUARE_BRACKET) {
        throw Error(`expected ']' at end of block closure, instead I got ${right_bracket}`)
    }
    return body
}

function block_body(): Node | undefined {
    const closure = new Node(Type.SYN_BLOCK_CLOSURE)

    let args: Node | undefined = undefined
    while (true) {
        const arg = block_argument()
        if (arg === undefined) {
            break
        }
        if (args === undefined) {
            args = new Node(Type.SYN_BLOCK_ARGUMENTS)
            closure.append(args)
        }
        args.append(arg)
    }
    if (args !== undefined) {
        const separator = lexer.lex()
        if (args.child.length > 0 && separator?.text !== "|") {
            throw Error(`block argument list must end with '|', instead I got ${separator}`)
        }
    }

    const tmps = temporaries()
    if (tmps) {
        closure.append(tmps)
    }

    const stmts = statements()
    if (stmts) {
        closure.append(stmts!)
    }

    return closure
}

function block_argument(): Node | undefined {
    const t0 = lexer.lex()
    if (t0?.type !== Type.TKN_COLON) {
        lexer.unlex(t0)
        return undefined
    }
    const t1 = lexer.lex()
    if (t1?.type !== Type.TKN_IDENTIFIER) {
        throw Error(`Expected identifier after ':' but got ${t1}`)
    }
    return t1
}

// 3.4.5 Statements
// <statements> ::=
//     (<return statement> ['.'] )
//   | (<expression> ['.' [<statements>]])
function statements(): Node | undefined {
    const ret = return_statement()
    if (ret !== undefined) {
        const dot = lexer.lex()
        if (dot?.type !== Type.TKN_DOT) {
            lexer.unlex(dot)
        }
        return ret
    }

    let stmts: Node | undefined = undefined
    let expr = expression()
    if (expr === undefined) {
        return undefined
    }

    while (true) {
        const dot = lexer.lex()
        if (dot?.type !== Type.TKN_DOT) {
            lexer.unlex(dot)
            break
        }
        let nextExpr = expression()
        if (nextExpr === undefined) {
            break
        }
        if (stmts === undefined) {
            stmts = new Node(Type.SYN_STATEMENTS)
            stmts.append(expr)
        }
        stmts.append(nextExpr)
    }
    return stmts === undefined ? expr : stmts
}

// 3.4.5.1 Return statement
// <return statement> ::= returnOperator <expression>
function return_statement(): Node | undefined {
    const returnOperator = lexer.lex()
    if (returnOperator?.type !== Type.TKN_RETURN) {
        lexer.unlex(returnOperator)
        return undefined
    }
    const expr = expression()
    if (expr === undefined) {
        throw Error(`missing expression after return operator`)
    }
    returnOperator.append(expr)
    return returnOperator
}

// 3.4.5.2 Expressions
// <expression> ::= <assignment> | <basic expression>
function expression(): Node | undefined {
    trace("expression")
    let t0
    t0 = assignment()
    if (t0 !== undefined) {
        return t0
    }
    t0 = basic_expression()
    if (t0 !== undefined) {
        return t0
    }
    lexer.unlex(t0)
    return undefined
}

// <assignment> ::= <assignment target> assignmentOperator <expression>
// <assignment target> := identifier
function assignment(): Node | undefined {
    const id = identifier()
    if (id === undefined) {
        return undefined
    }
    const assignmentOperator = lexer.lex()
    if (assignmentOperator?.type !== Type.TKN_ASSIGNMENT) {
        lexer.unlex(assignmentOperator)
        lexer.unlex(id)
        return undefined
    }

    const expr = expression()
    if (expr === undefined) {
        throw Error(`expected expression after ${id.text} := `)
    }
    assignmentOperator.append(id)
    assignmentOperator.append(expr)
    return assignmentOperator
}

// 3.4.5.2 Expressions
// <basic expression> ::= <primary> [<messages> <cascaded messages>]
// <cascaded messages> ::= (';' <messages>)*
// NOTE: for the sake of parsing, we implement the above two rules as one:
// <basic expression> ::= <primary> [<messages> (';' <messages>)* ]
// NOTE: Smalltalk-80, unlike ANSI Smalltalk, expects only one message after the ';'
function basic_expression(): Node | undefined {
    trace("basic_expression")
    let t0 = primary()
    if (t0 === undefined) {
        return t0
    }
    let n = new Node(Type.SYN_EXPRESSION)
    n.append(t0)

    let semicolon: Node | undefined = undefined
    while (true) {
        let t1 = messages()
        if (t1 !== undefined) {
            n.append(t1)
        } else {
            if (semicolon !== undefined) {
                lexer.unlex(semicolon)
                break
            }
        }

        semicolon = lexer.lex()
        if (semicolon?.type !== Type.TKN_SEMICOLON) {
            lexer.unlex(semicolon)
            break
        }
    }

    return n
}

// 3.4.5.2 Expressions
// <assignment target> := identifier

function identifier(): Node | undefined {
    const identifier = lexer.lex()
    if (identifier?.type === Type.TKN_IDENTIFIER) {
        return identifier
    }
    lexer.unlex(identifier)
    return undefined
}

// 3.4.5.2 Expressions
// <primary> ::= identifier | <literal> | <block constructor> | ( '(' <expression> ')' )
function primary(): Node | undefined {
    trace("primary")
    let t0

    t0 = identifier()
    if (t0 !== undefined) {
        return t0
    }

    t0 = literal()
    if (t0 !== undefined) {
        return t0
    }

    t0 = block_constructor()
    if (t0 !== undefined) {
        return t0
    }

    t0 = lexer.lex()
    if (t0?.type === Type.TKN_LEFT_PARENTHESIS) {
        const t1 = expression()
        if (t1 === undefined) {
            throw Error(`expected expression after '('`)
        }
        const t2 = lexer.lex()
        if (t2?.type !== Type.TKN_RIGHT_PARENTHESIS) {
            throw Error(`expected ')' after '(' <expression>`)
        }
        return t1
    }
    lexer.unlex(t0)
    return undefined
}

// 3.4.5.3 Messages
// * unary messages take no arguments
// * binary messages take one argument
// * keyword messages take one or more arguments
// <messages> ::=
//     (<unary message>+ <binary message>* [<keyword message>] )
//   | (<binary message>+ [<keyword message>] )
//   | <keyword message>
function messages(): Node | undefined {
    trace("messages")

    let n: Node | undefined
    while (true) {
        let t0 = unary_message()
        if (t0 === undefined) {
            break
        }
        if (n === undefined) {
            n = new Node(Type.SYN_MESSAGES)
        }
        n.append(t0)
    }

    while (true) {
        let t0 = binary_message()
        if (t0 === undefined) {
            break
        }
        if (n === undefined) {
            n = new Node(Type.SYN_MESSAGES)
        }
        n.append(t0)
    }

    while (true) {
        let t0 = keyword_message()
        if (t0 === undefined) {
            break
        }
        if (n === undefined) {
            n = new Node(Type.SYN_MESSAGES)
        }
        n.append(t0)
    }

    return n
}

// <binary message> ::= binarySelector <binary argument>
function binary_message(): Node | undefined {
    let t0 = binary_selector()
    if (t0 === undefined) {
        return undefined
    }
    let t1 = binary_argument()
    if (t1 !== undefined) {
        t0.append(t1)
        return t0
    }
    lexer.unlex(t1)
    lexer.unlex(t0)
    return undefined
}

// FIXME: binarySelector can also be ** or +++=+/ etc.
function binary_selector(): Node | undefined {
    let t0 = lexer.lex()
    if (t0?.type === Type.TKN_BINARY) {
        return t0
    }
    lexer.unlex(t0)
    return undefined
}

// <binary argument> ::= <primary> <unary message>*
function binary_argument(): Node | undefined {
    let t0 = primary()
    return t0
}

// <unary message> ::= unarySelector
function unary_message(): Node | undefined {
    trace("unary_message")
    let t0 = lexer.lex()
    if (t0?.type === Type.TKN_IDENTIFIER) {
        return t0
    }
    lexer.unlex(t0)
    return undefined
}

// <keyword message> ::= (keyword <keyword argument>)+
function keyword_message(): Node | undefined {
    trace("keyword_message")
    let t0 = keyword()
    if (t0 === undefined) {
        return undefined
    }
    let t1 = keyword_argument()
    if (t1 === undefined) {
        lexer.unlex(t0)
        return undefined
    }
    t0.append(t1)

    while (true) {
        let t2 = keyword()
        if (t2 === undefined) {
            break
        }
        let t3 = keyword_argument()
        if (t3 === undefined) {
            lexer.unlex(t3)
            break
        }
        t0.text! += t2.text
        t0.append(t3)
    }

    return t0
}

// <keyword argument> ::= <primary> <unary message>* <binary message>* 
function keyword_argument() {
    trace("keyword_argument")
    let t0 = primary()
    return t0
}

function keyword(): Node | undefined {
    trace("keyword")
    let t0 = lexer.lex()
    if (t0?.type === Type.TKN_KEYWORD) {
        return t0
    }
    lexer.unlex(t0)
    return undefined
}

// 3.4.6 Literals
// <literal> ::=
//     <number literal>
//   | <string literal>
//   | <character literal>
//   | <symbol literal>
//   | <selector literal>
//   | <array literal>
function literal(): Node | undefined {
    trace("literal")
    let t0
    t0 = number_literal()
    if (t0 !== undefined) {
        return t0
    }
    t0 = string_literal()
    if (t0 !== undefined) {
        return t0
    }
    return undefined
}

// 3.4.6.1 Numeric Literals
// <number literal> :: = ['-'] <number>
// <number> :== integer | float | scaledDecimal
function number_literal(): Node | undefined {
    trace("number_literal")
    let t0 = lexer.lex()
    let minus = false
    if (t0?.type === Type.TKN_BINARY && t0?.text === '-') {
        minus = true
    } else {
        lexer.unlex(t0)
        t0 = undefined
    }
    let t1 = integer()
    if (t1 !== undefined) {
        if (minus) {
            t1.text = `-${t1.text}`
        }
        return t1
    }
    lexer.unlex(t1)
    lexer.unlex(t0)
    return undefined
}

function integer(): Node | undefined {
    let t0 = lexer.lex()
    if (t0?.type === Type.TKN_INTEGER) {
        return t0
    }
    lexer.unlex(t0)
    return undefined
}

function string_literal() {
    let t0 = lexer.lex()
    if (t0?.type === Type.TKN_STRING) {
        return t0
    }
    lexer.unlex(t0)
    return undefined
}

//
// evaluate
//

let transscript = ""

class ST_Scope {
    private parent?: ST_Scope
    private map = new Map<string, any>()
    constructor(parent: ST_Scope | undefined = undefined) {
        this.parent = parent
    }
    init(name: string, variable: any) {
        this.map.set(name, variable)
    }
    set(name: string, variable: any) {
        let scope: ST_Scope | undefined = this
        while (scope !== undefined && !scope.map.has(name)) {
            scope = scope.parent
        }
        if (scope === undefined) {
            scope = this
        }
        scope.map.set(name, variable)
    }
    get(name: string): any {
        if (!this.map.has(name)) {
            if (this.parent === undefined) {
                throw Error(`variable ${name} does not exist`)
            }
            return this.parent.get(name)
        }
        return this.map.get(name)
    }
}

class ST_String {
    value: string
    constructor(value: string) {
        this.value = value
    }
    toString() {
        return `this.value`
    }
    printNl() {
        transscript += this.value
    }
    _comma(a: string) {
        return new ST_String(this.value + a)
    }
}

class ST_Number {
    value: number
    constructor(value: number) {
        this.value = value
    }
    toString() {
        return `${this.value}`
    }
    printNl() {
        transscript += `${this.value}`
    }
    _add(a: ST_Number) {
        return new ST_Number(this.value + a.value)
    }
    _sub(a: ST_Number) {
        return new ST_Number(this.value - a.value)
    }
    _mul(a: ST_Number) {
        return new ST_Number(this.value * a.value)
    }
    _div(a: ST_Number) {
        return new ST_Number(this.value / a.value)
    }
}

class ST_Closure {
    _args: Node | undefined = undefined
    _tmps: Node | undefined = undefined
    _stmt: Node | undefined = undefined
    scope: ST_Scope

    constructor(value: Node, scope: ST_Scope) { // FIXME: we must use the scope at creation time, not call time!!!!
        this.scope = scope
        for (let child of value.child) {
            switch (child?.type) {
                case Type.SYN_BLOCK_ARGUMENTS:
                    this._args = child
                    break
                case Type.SYN_TEMPORARIES:
                    this._tmps = child
                    break
                default:
                    this._stmt = child
            }
        }
    }
    _scope() {
        const closureScope = new ST_Scope(this.scope)
        if (this._tmps) {
            for (let tmp of this._tmps.child) {
                closureScope.init(tmp?.text!, undefined)
            }
        }
        return closureScope
    }

    value() {
        const closureScope = this._scope()
        return evaluate(this._stmt, closureScope)
    }
    value_(arg0: any) {
        const closureScope = this._scope()
        closureScope.init(this._args?.child[0]?.text!, arg0)
        return evaluate(this._stmt, closureScope)
    }
    value_value_(arg0: any, arg1: any) {
        const closureScope = this._scope()
        closureScope.init(this._args?.child[0]?.text!, arg0)
        closureScope.init(this._args?.child[1]?.text!, arg1)
        return evaluate(this._stmt, closureScope)
    }
    value_value_value_(arg0: any, arg1: any, arg2: any) {
        const closureScope = this._scope()
        closureScope.init(this._args?.child[0]?.text!, arg0)
        closureScope.init(this._args?.child[1]?.text!, arg1)
        closureScope.init(this._args?.child[2]?.text!, arg2)
        return evaluate(this._stmt, closureScope)
    }
    valueWithArguments_(args: any) {
        const closureScope = this._scope()
        return evaluate(this._stmt, closureScope)
    }
}

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

function evaluate(node: Node | undefined, scope: ST_Scope = new ST_Scope()): any {
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
            return primary[methodName].call(primary)
        case Type.TKN_BINARY:
        case Type.TKN_KEYWORD: {
            const args = node.child.map(n => evaluate(n!, scope))
            return primary[methodName].call(primary, ...args)
        }
    }
    throw Error("Not implemented yet")
}

describe("parse", () => {
    describe("messages", () => {
        it("'hello' printNl", () => {
            lexer = new Lexer("'hello' printNl")
            const node = expression()

            expect(node?.type).toBe(Type.SYN_EXPRESSION)
            expect(node?.child[0]?.type).toBe(Type.TKN_STRING)
            expect(node?.child[0]?.text).toBe("hello")
            expect(node?.child[1]?.type).toBe(Type.SYN_MESSAGES)
            expect(node?.child[1]?.child[0]?.type).toBe(Type.TKN_IDENTIFIER)
            expect(node?.child[1]?.child[0]?.text).toBe("printNl")

            transscript = ""
            evaluate(node!)
            expect(transscript).toBe("hello")
        })

        it("42 printNl", () => {
            lexer = new Lexer("42 printNl")
            const node = expression()
            expect(node?.type).toBe(Type.SYN_EXPRESSION)
            expect(node?.child[0]?.type).toBe(Type.TKN_INTEGER)
            expect(node?.child[0]?.text).toBe("42")
            expect(node?.child[1]?.type).toBe(Type.SYN_MESSAGES)
            expect(node?.child[1]?.child[0]?.type).toBe(Type.TKN_IDENTIFIER)
            expect(node?.child[1]?.child[0]?.text).toBe("printNl")

            transscript = ""
            evaluate(node!)
            expect(transscript).toBe("42")
        })

        // 1 to: 20 do: [:x | x printNl ]
        // 1 to: 20 by: 2 do: [:x | x printNl ]
        // 20 to: 1 by: -1 do: [:x | x printNl ]
        it("1 to: 20", () => {
            lexer = new Lexer("1 to: 20")

            const node = expression()

            expect(node?.type).toBe(Type.SYN_EXPRESSION)
            // primary
            expect(node?.child[0]?.type).toBe(Type.TKN_INTEGER)
            expect(node?.child[0]?.text).toBe("1")
            // messages
            expect(node?.child[1]?.type).toBe(Type.SYN_MESSAGES)
            // method
            expect(node?.child[1]?.child[0]?.type).toBe(Type.TKN_KEYWORD)
            expect(node?.child[1]?.child[0]?.text).toBe("to:")
            // 1st argument
            expect(node?.child[1]?.child[0]?.child[0]?.type).toBe(Type.TKN_INTEGER)
            expect(node?.child[1]?.child[0]?.child[0]?.text).toBe("20")
        })
        it("1 to: 20 by: 2", () => {
            lexer = new Lexer("1 to: 20 by: 2")

            const node = expression()

            expect(node?.type).toBe(Type.SYN_EXPRESSION)
            // primary
            expect(node?.child[0]?.type).toBe(Type.TKN_INTEGER)
            expect(node?.child[0]?.text).toBe("1")
            // messsages
            expect(node?.child[1]?.type).toBe(Type.SYN_MESSAGES)
            // method
            expect(node?.child[1]?.child[0]?.type).toBe(Type.TKN_KEYWORD)
            expect(node?.child[1]?.child[0]?.text).toBe("to:by:")
            // 1st argument
            expect(node?.child[1]?.child[0]?.child[0]?.type).toBe(Type.TKN_INTEGER)
            expect(node?.child[1]?.child[0]?.child[0]?.text).toBe("20")
            // 2nd argument
            expect(node?.child[1]?.child[0]?.child[1]?.type).toBe(Type.TKN_INTEGER)
            expect(node?.child[1]?.child[0]?.child[1]?.text).toBe("2")
        })

        it("1 + 3", () => {
            lexer = new Lexer("1 + 3")

            const node = expression()

            expect(node?.type).toBe(Type.SYN_EXPRESSION)
            // primary
            expect(node?.child[0]?.type).toBe(Type.TKN_INTEGER)
            expect(node?.child[0]?.text).toBe("1")
            // messages
            expect(node?.child[1]?.type).toBe(Type.SYN_MESSAGES)
            // method
            expect(node?.child[1]?.child[0]?.type).toBe(Type.TKN_BINARY)
            expect(node?.child[1]?.child[0]?.text).toBe("+")
            // 1st argument
            expect(node?.child[1]?.child[0]?.child[0]?.type).toBe(Type.TKN_INTEGER)
            expect(node?.child[1]?.child[0]?.child[0]?.text).toBe("3")

            const r = evaluate(node!)
            expect(r.value).toBe(4)
        })

        it("2 * 3", () => {
            lexer = new Lexer("2 * 3")
            const node = expression()
            const r = evaluate(node!)
            expect(r.value).toBe(6)
        })

        it("10 - 3", () => {
            lexer = new Lexer("10 - 3")
            const node = expression()
            const r = evaluate(node!)
            expect(r.value).toBe(7)
        })

        it("8 / 2", () => {
            lexer = new Lexer("8 / 2")
            const node = expression()
            const r = evaluate(node!)
            expect(r.value).toBe(4)
        })

        it("8 / 2 + 6", () => {
            lexer = new Lexer("8 / 2 + 6")
            const node = expression()
            const r = evaluate(node!)
            expect(r.value).toBe(10)
        })
    })

    describe("cascaded messages", () => {

        it("2 + 3 ; - 1", () => {
            lexer = new Lexer("2 + 3 ; - 1")
            const node = expression()

            expect(node?.type).toBe(Type.SYN_EXPRESSION)
            expect(node?.child[0]?.type).toBe(Type.TKN_INTEGER)
            expect(node?.child[0]?.text).toBe("2")
            expect(node?.child[1]?.type).toBe(Type.SYN_MESSAGES)
            expect(node?.child[1]?.child[0]?.type).toBe(Type.TKN_BINARY)
            expect(node?.child[1]?.child[0]?.text).toBe("+")
            expect(node?.child[1]?.child[0]?.child[0]?.type).toBe(Type.TKN_INTEGER)
            expect(node?.child[1]?.child[0]?.child[0]?.text).toBe("3")
            expect(node?.child[2]?.type).toBe(Type.SYN_MESSAGES)
            expect(node?.child[2]?.child[0]?.type).toBe(Type.TKN_BINARY)
            expect(node?.child[2]?.child[0]?.text).toBe("-")
            expect(node?.child[2]?.child[0]?.child[0]?.type).toBe(Type.TKN_INTEGER)
            expect(node?.child[2]?.child[0]?.child[0]?.text).toBe("1")

            const r = evaluate(node!)
            expect(r.value).toBe(1)
        })

        it("2 + 3 * 4 ; - 1", () => {
            lexer = new Lexer("2 + 3 * 4 ; - 1")
            const node = expression()
            const r = evaluate(node!)
            expect(r.value).toBe(4)
        })

        it("2 + 3 * 4 * 2 ; + 1", () => {
            lexer = new Lexer("2 + 3 * 4 * 2 ; + 1")
            const node = expression()
            const r = evaluate(node!)
            expect(r.value).toBe(21)
        })

        it("1 + 3 * 4 ; + 5 ; + 6", () => {
            lexer = new Lexer("1 + 3 * 4 ; + 5 ; + 6")
            const node = expression()
            const r = evaluate(node!)
            expect(r.value).toBe(10)
        })

        // ANSI Smalltalk allows multiple messages after ';' but I haven't found
        // an implementation actually resolving this without an error message.
        // but 1 + 3 + 7 + 8 = 19 looks reasonable
        it("1 + 3 * 4 ; + 5 + 6 ; + 7 + 8", () => {
            lexer = new Lexer("1 + 3 * 4 ; + 5 + 6 ; + 7 + 8")
            const node = expression()

            expect(node?.type).toBe(Type.SYN_EXPRESSION)
            expect(node?.child[0]?.type).toBe(Type.TKN_INTEGER)
            expect(node?.child[0]?.text).toBe("1")

            expect(node?.child[1]?.type).toBe(Type.SYN_MESSAGES)
            expect(node?.child[1]?.child[0]?.type).toBe(Type.TKN_BINARY)
            expect(node?.child[1]?.child[0]?.text).toBe("+")
            expect(node?.child[1]?.child[0]?.child[0]?.type).toBe(Type.TKN_INTEGER)
            expect(node?.child[1]?.child[0]?.child[0]?.text).toBe("3")

            expect(node?.child[1]?.type).toBe(Type.SYN_MESSAGES)
            expect(node?.child[1]?.child[1]?.type).toBe(Type.TKN_BINARY)
            expect(node?.child[1]?.child[1]?.text).toBe("*")
            expect(node?.child[1]?.child[1]?.child[0]?.type).toBe(Type.TKN_INTEGER)
            expect(node?.child[1]?.child[1]?.child[0]?.text).toBe("4")

            expect(node?.child[2]?.type).toBe(Type.SYN_MESSAGES)
            expect(node?.child[2]?.child[0]?.type).toBe(Type.TKN_BINARY)
            expect(node?.child[2]?.child[0]?.text).toBe("+")
            expect(node?.child[2]?.child[0]?.child[0]?.type).toBe(Type.TKN_INTEGER)
            expect(node?.child[2]?.child[0]?.child[0]?.text).toBe("5")

            expect(node?.child[2]?.type).toBe(Type.SYN_MESSAGES)
            expect(node?.child[2]?.child[1]?.type).toBe(Type.TKN_BINARY)
            expect(node?.child[2]?.child[1]?.text).toBe("+")
            expect(node?.child[2]?.child[1]?.child[0]?.type).toBe(Type.TKN_INTEGER)
            expect(node?.child[2]?.child[1]?.child[0]?.text).toBe("6")

            expect(node?.child[3]?.type).toBe(Type.SYN_MESSAGES)
            expect(node?.child[3]?.child[0]?.type).toBe(Type.TKN_BINARY)
            expect(node?.child[3]?.child[0]?.text).toBe("+")
            expect(node?.child[3]?.child[0]?.child[0]?.type).toBe(Type.TKN_INTEGER)
            expect(node?.child[3]?.child[0]?.child[0]?.text).toBe("7")

            expect(node?.child[3]?.type).toBe(Type.SYN_MESSAGES)
            expect(node?.child[3]?.child[1]?.type).toBe(Type.TKN_BINARY)
            expect(node?.child[3]?.child[1]?.text).toBe("+")
            expect(node?.child[3]?.child[1]?.child[0]?.type).toBe(Type.TKN_INTEGER)
            expect(node?.child[3]?.child[1]?.child[0]?.text).toBe("8")

            const r = evaluate(node!)
            expect(r.value).toBe(19)
        })
    })

    describe("parenthesis", () => {
        it("( 1 + 2 ) * 3", () => {
            lexer = new Lexer("( 1 + 2 ) * 3")
            const node = expression()
            const r = evaluate(node!)
            expect(r.value).toBe(9)
        })
        it("1 * ( 2  + 3 )", () => {
            lexer = new Lexer("1 * ( 2  + 3 )")
            const node = expression()
            const r = evaluate(node!)
            expect(r.value).toBe(5)
        })
    })

    describe("statements", () => {
        it("the result of the last statement is returned (1. 2.)", () => {
            lexer = new Lexer("1. 2.")
            const node = program()

            expect(node?.type).toBe(Type.SYN_STATEMENTS)
            expect(node?.child[0]?.type).toBe(Type.SYN_EXPRESSION)
            expect(node?.child[0]?.child[0]?.type).toBe(Type.TKN_INTEGER)
            expect(node?.child[0]?.child[0]?.text).toBe("1")
            expect(node?.child[1]?.type).toBe(Type.SYN_EXPRESSION)
            expect(node?.child[1]?.child[0]?.type).toBe(Type.TKN_INTEGER)
            expect(node?.child[1]?.child[0]?.text).toBe("2")

            const r = evaluate(node!)
            expect(r.value).toBe(2)
        })
        it("all statements are evaluated (a:='hello'. b:='world'.)", () => {
            lexer = new Lexer("a:='hello'. b:='world'.")
            const node = program()
            const scope = new ST_Scope()
            const r = evaluate(node!, scope)
            expect(r.value).toBe('world')
            expect(scope.get("a").value).toBe("hello")
            expect(scope.get("b").value).toBe("world")
        })
    })

    describe("variables", () => {
        it("set variable: a := 7", () => {
            lexer = new Lexer("a := 7")
            const node = expression()

            expect(node?.type).toBe(Type.TKN_ASSIGNMENT)
            expect(node?.child[0]?.type).toBe(Type.TKN_IDENTIFIER)
            expect(node?.child[1]?.type).toBe(Type.SYN_EXPRESSION)
            expect(node?.child[1]?.child[0]?.type).toBe(Type.TKN_INTEGER)
            expect(node?.child[1]?.child[0]?.text).toBe("7")

            const scope = new ST_Scope()
            evaluate(node!, scope)
            expect(scope.get("a").value).toBe(7)
        })
        it("read variable: a := 7. a + 3.", () => {
            lexer = new Lexer("a := 7. a + 3.")
            const node = program()
            const r = evaluate(node!)
            expect(r.value).toBe(10)
        })
    })

    describe("block closure", () => {
        it("[||]", () => {
            lexer = new Lexer("[||]")
            const node = program()
            // node?.printTree()
            expect(node?.type).toBe(Type.SYN_EXPRESSION)
            expect(node?.child[0]?.type).toBe(Type.SYN_BLOCK_CLOSURE)
            expect(node?.child[0]?.child).toHaveLength(0)
        })
        it("[|x|]", () => {
            lexer = new Lexer("[|x|]")
            const node = program()
            // node?.printTree()
            expect(node?.type).toBe(Type.SYN_EXPRESSION)
            expect(node?.child[0]?.type).toBe(Type.SYN_BLOCK_CLOSURE)
            expect(node?.child[0]?.child).toHaveLength(1)
            expect(node?.child[0]?.child[0]?.type).toBe(Type.SYN_TEMPORARIES)
            expect(node?.child[0]?.child[0]?.child).toHaveLength(1)
            expect(node?.child[0]?.child[0]?.child[0]?.type).toBe(Type.TKN_IDENTIFIER)
            expect(node?.child[0]?.child[0]?.child[0]?.text).toBe("x")
        })
        it("[|x y|]", () => {
            lexer = new Lexer("[|x y|]")
            const node = program()
            // node?.printTree()
            expect(node?.type).toBe(Type.SYN_EXPRESSION)
            expect(node?.child[0]?.type).toBe(Type.SYN_BLOCK_CLOSURE)
            expect(node?.child[0]?.child).toHaveLength(1)
            expect(node?.child[0]?.child[0]?.type).toBe(Type.SYN_TEMPORARIES)
            expect(node?.child[0]?.child[0]?.child).toHaveLength(2)
            expect(node?.child[0]?.child[0]?.child[0]?.type).toBe(Type.TKN_IDENTIFIER)
            expect(node?.child[0]?.child[0]?.child[0]?.text).toBe("x")
            expect(node?.child[0]?.child[0]?.child[1]?.type).toBe(Type.TKN_IDENTIFIER)
            expect(node?.child[0]?.child[0]?.child[1]?.text).toBe("y")
        })

        it("[ ]", () => {
            lexer = new Lexer("[ ]")
            const node = program()
            // node?.printTree()
            expect(node?.type).toBe(Type.SYN_EXPRESSION)
            expect(node?.child[0]?.type).toBe(Type.SYN_BLOCK_CLOSURE)
            expect(node?.child[0]?.child).toHaveLength(0)
            // const r = evaluate(node!)
            // expect(r instanceof ST_Closure).toBeTruthy()
        })

        it("[ :a | ]", () => {
            lexer = new Lexer("[ :a | ]")
            const node = program()
            // node?.printTree()

            expect(node?.type).toBe(Type.SYN_EXPRESSION)
            expect(node?.child[0]?.type).toBe(Type.SYN_BLOCK_CLOSURE)
            expect(node?.child[0]?.child[0]?.type).toBe(Type.SYN_BLOCK_ARGUMENTS)
            expect(node?.child[0]?.child[0]?.child).toHaveLength(1)
            expect(node?.child[0]?.child[0]?.child[0]?.type).toBe(Type.TKN_IDENTIFIER)
            expect(node?.child[0]?.child[0]?.child[0]?.text).toBe("a")

            // const r = evaluate(node!)
            // expect(r instanceof ST_Closure).toBeTruthy()
        })

        it("[ :a :b | ]", () => {
            lexer = new Lexer("[ :a :b | ]")
            const node = program()
            // node?.printTree()

            expect(node?.type).toBe(Type.SYN_EXPRESSION)
            expect(node?.child[0]?.type).toBe(Type.SYN_BLOCK_CLOSURE)
            expect(node?.child[0]?.child[0]?.type).toBe(Type.SYN_BLOCK_ARGUMENTS)
            expect(node?.child[0]?.child[0]?.child).toHaveLength(2)
            expect(node?.child[0]?.child[0]?.child[0]?.type).toBe(Type.TKN_IDENTIFIER)
            expect(node?.child[0]?.child[0]?.child[0]?.text).toBe("a")
            expect(node?.child[0]?.child[0]?.child[1]?.type).toBe(Type.TKN_IDENTIFIER)
            expect(node?.child[0]?.child[0]?.child[1]?.text).toBe("b")

            // const r = evaluate(node!)
            // expect(r instanceof ST_Closure).toBeTruthy()
        })

        it("[ 7 ]", () => {
            lexer = new Lexer("[ 7 ]")
            const node = program()
            // node?.printTree()
            expect(node?.type).toBe(Type.SYN_EXPRESSION)
            expect(node?.child[0]?.type).toBe(Type.SYN_BLOCK_CLOSURE)
            expect(node?.child[0]?.child).toHaveLength(1)
            expect(node?.child[0]?.child[0]?.type).toBe(Type.SYN_EXPRESSION)
            expect(node?.child[0]?.child[0]?.child[0]?.type).toBe(Type.TKN_INTEGER)
            expect(node?.child[0]?.child[0]?.child[0]?.text).toBe("7")

            // const r = evaluate(node!)
            // expect(r instanceof ST_Closure).toBeTruthy()
        })

        it("[ 7. 3. ]", () => {
            lexer = new Lexer("[ 7. 3. ]")
            const node = program()
            // node?.printTree()
            expect(node?.type).toBe(Type.SYN_EXPRESSION)
            expect(node?.child[0]?.type).toBe(Type.SYN_BLOCK_CLOSURE)
            expect(node?.child[0]?.child[0]?.type).toBe(Type.SYN_STATEMENTS)
            expect(node?.child[0]?.child[0]?.child).toHaveLength(2)
            expect(node?.child[0]?.child[0]?.child[0]?.type).toBe(Type.SYN_EXPRESSION)
            expect(node?.child[0]?.child[0]?.child[0]?.child[0]?.type).toBe(Type.TKN_INTEGER)
            expect(node?.child[0]?.child[0]?.child[0]?.child[0]?.text).toBe("7")
            expect(node?.child[0]?.child[0]?.child[1]?.type).toBe(Type.SYN_EXPRESSION)
            expect(node?.child[0]?.child[0]?.child[1]?.child[0]?.type).toBe(Type.TKN_INTEGER)
            expect(node?.child[0]?.child[0]?.child[1]?.child[0]?.text).toBe("3")

            // const r = evaluate(node!)
            // expect(r instanceof ST_Closure).toBeTruthy()
        })

        it("[ :a | b ]", () => {
            lexer = new Lexer("[ :a | b. c. ]")
            const node = program()
            // node?.printTree()
            expect(node?.type).toBe(Type.SYN_EXPRESSION)
            expect(node?.child[0]?.type).toBe(Type.SYN_BLOCK_CLOSURE)
            expect(node?.child[0]?.child).toHaveLength(2)
            expect(node?.child[0]?.child[0]?.type).toBe(Type.SYN_BLOCK_ARGUMENTS)
            expect(node?.child[0]?.child[1]?.type).toBe(Type.SYN_STATEMENTS)

            // const r = evaluate(node!)
            // expect(r instanceof ST_Closure).toBeTruthy()
        })

        it("[ :a | |b| c]", () => {
            lexer = new Lexer("[ :a | |b| c]")
            const node = program()
            // node?.printTree()
            expect(node?.type).toBe(Type.SYN_EXPRESSION)
            expect(node?.child[0]?.type).toBe(Type.SYN_BLOCK_CLOSURE)
            expect(node?.child[0]?.child).toHaveLength(3)
            expect(node?.child[0]?.child[0]?.type).toBe(Type.SYN_BLOCK_ARGUMENTS)
            expect(node?.child[0]?.child[1]?.type).toBe(Type.SYN_TEMPORARIES)
            expect(node?.child[0]?.child[2]?.type).toBe(Type.SYN_EXPRESSION)

            // const r = evaluate(node!)
            // expect(r instanceof ST_Closure).toBeTruthy()
        })

        it("[ :x | x + 7 ]", () => {
            lexer = new Lexer("[ :x | x + 7 ]") // a  = (x) => { return x + 1 } ; a.call(undefined, 3)
            const node = expression()

            expect(node?.type).toBe(Type.SYN_EXPRESSION)
            const basic_expression = node!
            expect(basic_expression.child[0]?.type).toBe(Type.SYN_BLOCK_CLOSURE)
            const block_closure = basic_expression.child[0]!
            expect(block_closure.child[0]?.type).toBe(Type.SYN_BLOCK_ARGUMENTS)

            const args = block_closure.child[0]!
            expect(args.child[0]?.type).toBe(Type.TKN_IDENTIFIER)
            expect(args.child[0]?.text).toBe("x")

            expect(block_closure.child[1]?.type).toBe(Type.SYN_EXPRESSION)
            const bodyExpr = block_closure.child[1]
            expect(bodyExpr?.child[0]?.type).toBe(Type.TKN_IDENTIFIER)
            expect(bodyExpr?.child[0]?.text).toBe("x")
            expect(bodyExpr?.child[1]?.type).toBe(Type.SYN_MESSAGES)
            expect(bodyExpr?.child[1]?.child[0]?.type).toBe(Type.TKN_BINARY)
            expect(bodyExpr?.child[1]?.child[0]?.text).toBe("+")
            expect(bodyExpr?.child[1]?.child[0]?.child[0]?.type).toBe(Type.TKN_INTEGER)
            expect(bodyExpr?.child[1]?.child[0]?.child[0]?.text).toBe("7")
        })

        it("a := [ 7 ]. a value.", () => {
            lexer = new Lexer("a := [ 7 ]. a value.")
            const node = program()
            // node?.printTree()

            const r = evaluate(node)
            expect(r.value).toBe(7)
        })

        it("a := [ :x | x + 2 ]. a value: 8.", () => {
            lexer = new Lexer("a := [ :x | x + 2 ]. a value: 8.")
            const node = program()
            const r = evaluate(node)
            expect(r.value).toBe(10)
        })

        it("a := [ :x :y | x + y ]. a value: 8 value: 2.", () => {
            lexer = new Lexer("a := [ :x :y | x + y ]. a value: 8 value: 2.")
            const node = program()
            const r = evaluate(node)
            expect(r.value).toBe(10)
        })

        it("a := [ :x :y :z | x + y * z]. a value: 8 value: 2 value: 4.", () => {
            lexer = new Lexer("a := [ :x :y :z | x + y * z]. a value: 8 value: 2 value: 4.")
            const node = program()
            const r = evaluate(node)
            expect(r.value).toBe(40)
        })

        // valueWithArguments: argumentsArray

        it("closure can read outer scope: a:=7. [:b|a+b] value:3.", () => {
            lexer = new Lexer("a:=7. [:b|a+b] value:3.")
            const node = program()
            const r = evaluate(node)
            expect(r.value).toBe(10)
        })

        it("closure can write outer scope: a:=7. [:b|a:=a+b] value:3.", () => {
            lexer = new Lexer("a:=7. [:b|a:=a+b] value:3.")
            const node = program()
            const scope = new ST_Scope()
            const r = evaluate(node, scope)
            expect(r.value).toBe(10)
            expect(scope.get("a").value).toBe(10)
        })

        // smalltalk doesn't want us to overwrite b
        // a:=7. [:b|b:=a+b] value:3

        it("closure can have local variables: a := 7. c := 42. [:b| |c| c := a+b. c / 2.] value:3.", () => {
            lexer = new Lexer("a := 7. c := 42. [:b| |c| c := a+b. c / 2.] value:3.")
            const node = program()
            const scope = new ST_Scope()

            const r = evaluate(node, scope)

            expect(r.value).toBe(5)
            expect(scope.get("a").value).toBe(7)
            expect(scope.get("c").value).toBe(42)
        })
    })

    // Rectangle new.
})
