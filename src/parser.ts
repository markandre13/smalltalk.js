import { Lexer } from "./lexer"
import { Node } from "./node"
import { Type } from "./type"

let lexer!: Lexer

export function setLexer(program: string) {
    lexer = new Lexer(program)
}

function trace(name: string) {
    // console.log(name)
}

// Grammer is based on
// NCITS J20 DRAFT of ANSI Smalltalk Standard; December, 1996; revision 1.9

// hand-coded recursive-descent parser for Smalltalk (which is LL(1))

// 3.3.1
// <<Smalltalk program>> ::= <<program element>>+ <<initialization ordering>> 
// <<program element>> ::= <<class definition>>
//                     | <<global definition>>
//                     | <<pool definition>>
//                     | <<program initializer definition>>

// 3.3.5
// <<program initializer definition >> ::= <initializer definition>
export function program(): Node | undefined {
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
    const temp = temporaries()
    const stmt = statements()
    const init = new Node(Type.SYN_INITIALIZER_DEFINITION)
    init.child.push(temp, stmt)
    return init
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
export function expression(): Node | undefined {
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
    // character_literal
    // symbol_literal
    // selector_literal
    t0 = array_literal()
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

// 3.4.6.2 Character Literals

// 3.4.6.3 String Literals
function string_literal() {
    let t0 = lexer.lex()
    if (t0?.type === Type.TKN_STRING) {
        return t0
    }
    lexer.unlex(t0)
    return undefined
}

// 3.4.6.4 Symbol Literals
// 3.4.6.5 Selector Literals
// 3.4.6.6 Array Literals

function array_literal() {
    let t0 = lexer.lex()
    if (t0?.type !== Type.TKN_ARRAY_LITERAL) {
        lexer.unlex(t0)
        return undefined
    }
    while(true) {
        let t1 = literal()
        if (t1 !== undefined) {
            t0.append(t1)
            continue
        }
        t1 = identifier()
        if (t1 !== undefined) {
            t0.append(t1)
            continue
        }
        break
    }
    let t1 = lexer.lex()
    if (t1?.type !== Type.TKN_RIGHT_PARENTHESIS) {
        throw Error('array literal needs to be #( <literal|identifier>* )')
    }
    return t0
}