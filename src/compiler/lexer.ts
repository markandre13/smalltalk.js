import { Node } from "./node"
import { Type } from "./type"

export class Lexer {
    data: string
    line: number
    column: number

    pos: number
    state: number
    radix!: number
    numericText!: string
    text?: string // TODO: working with substrings might be faster?
    tokenStack: Array<Node>

    static isAlpha(c: string): boolean {
        let n = c.charCodeAt(0)
        return (
            (0x41 <= n && n <= 0x5a) ||
            (0x61 <= n && n <= 0x7a)
        )
    }

    static isUppercaseAlpha(c: string): boolean {
        let n = c.charCodeAt(0)
        return (
            (0x41 <= n && n <= 0x5a)
        )
    }

    static isDigit(c: string): boolean {
        let n = c.charCodeAt(0)
        return (0x30 <= n && n <= 0x39)
    }

    static isAlphaNumeric(c: string): boolean {
        return Lexer.isAlpha(c) || Lexer.isDigit(c)
    }

    static isBinaryCharacter(c: string): boolean {
        return '!%&*+,/<=>?@\\~|-'.includes(c)
    }

    constructor(data: string) {
        this.data = data
        this.line = 1
        this.column = 1
        this.pos = 0
        this.state = 0
        this.tokenStack = new Array<Node>()
    }

    eof(): boolean {
        return this.pos >= this.data.length
    }
    unparsed(): string {
        let t = ''
        for (let i = this.tokenStack.length - 1; i >= 0; --i) {
            t += this.tokenStack[i]?.toString()
        }
        t += this.data.substring(this.pos)
        return t
    }

    getc(): string {
        let c = this.data[this.pos++]
        if (c === '\n') {
            ++this.line
            this.column = 1
        } else {
            ++this.column // FIXME: tabulators
        }
        return c!
    }

    ungetc(): void {
        let c = this.data[--this.pos]
        if (c == '\n') {
            let i
            for (i = this.pos; i > 0; --i) {
                if (this.data[i] == '\n')
                    break
            }
            this.column = i
            --this.line
        } else {
            --this.column
        }
    }

    unlex(token: Node | undefined): void {
        if (token === undefined)
            return
        if (token.child.length !== 0)
            throw Error("can not unlex token " + token.toString() + " with children")
        // FIXME: adjust this.line and this.column
        this.tokenStack.push(token)
    }

    lex(): Node | undefined {
        if (this.tokenStack.length > 0) {
            return this.tokenStack.pop()
        }
        // console.log(`LEX: eof=${this.eof()}`)
        let eof = this.eof()
        while (!eof) {
            let c
            if (this.eof()) {
                ++this.pos
                c = " "
                eof = true
            } else {
                c = this.getc()
            }
            // console.log(`state=${this.state} c='${c}', pos=${this.pos}`)
            let oldstate = this.state
            switch (this.state) {
                case 0:
                    switch (c) {
                        case ' ':
                        case '\r':
                        case '\n':
                        case '\t':
                        case '\v':
                            break
                        case '_':
                        case '←':
                            return new Node(Type.TKN_ASSIGNMENT)
                        case '↑':
                        case '^':
                            return new Node(Type.TKN_RETURN)
                        case ';':
                            return new Node(Type.TKN_SEMICOLON, c)
                        case '.':
                            return new Node(Type.TKN_DOT, c)
                        case '(':
                            return new Node(Type.TKN_LEFT_PARENTHESIS, c)
                        case ')':
                            return new Node(Type.TKN_RIGHT_PARENTHESIS, c)
                        case '[':
                            return new Node(Type.TKN_LEFT_SQUARE_BRACKET, c)
                        case ']':
                            return new Node(Type.TKN_RIGHT_SQUARE_BRACKET, c)
                        case '\'':
                            this.state = 3
                            this.text = ""
                            continue
                        case '"':
                            this.state = 5
                            continue
                        case ':':
                            this.state = 6
                            continue
                        case '#':
                            this.state = 8
                            continue
                        default:
                            if (Lexer.isAlpha(c)) {
                                this.text = ""
                                this.state = 1
                                break
                            }
                            if (Lexer.isDigit(c)) {
                                this.text = ""
                                this.state = 20
                                break
                            }
                            if (Lexer.isBinaryCharacter(c)) {
                                this.text = ""
                                this.state = 7
                                break
                            }
                            throw Error(`Unknown character '${c}'`)
                    }
                    break
                case 1: // a-z...
                    if (Lexer.isAlphaNumeric(c)) {
                        break
                    }
                    if (c === ':') {
                        this.state = 2
                        continue
                    }
                    this.ungetc()
                    this.state = 0
                    return new Node(Type.TKN_IDENTIFIER, this.text)
                case 2:
                    this.state = 0
                    if (c === '=') {
                        this.unlex(new Node(Type.TKN_ASSIGNMENT))
                        return new Node(Type.TKN_IDENTIFIER, this.text)
                    }
                    this.ungetc()
                    return new Node(Type.TKN_KEYWORD, this.text + ":")
                case 3: // '...?
                    if (c === '\'') {
                        this.state = 4
                        continue
                        // return new Node(Type.TKN_STRING, this.text)
                    }
                    break
                case 4: // '...'?
                    if (c === '\'') {
                        this.state = 3
                        break
                    }
                    this.ungetc()
                    this.state = 0
                    return new Node(Type.TKN_STRING, this.text)
                case 5: // "...
                    if (c == '"') {
                        this.state = 0
                        continue
                    }
                    continue
                case 6: // :?
                    this.state = 0
                    if (c === '=') {
                        return new Node(Type.TKN_ASSIGNMENT)
                    }
                    this.ungetc()
                    return new Node(Type.TKN_COLON)
                case 7: // <binary character>
                    if (!Lexer.isBinaryCharacter(c)) {
                        this.ungetc()
                        this.state = 0
                        return new Node(Type.TKN_BINARY, this.text)
                    }
                    break
                case 8: // #...
                    this.state = 0
                    if (c === '(') {
                        return new Node(Type.TKN_ARRAY_LITERAL) // this is a hack?
                    }
                    if (c === '\'') {
                        this.text = ''
                        this.state = 13
                        continue
                    }
                    if (Lexer.isAlpha(c)) {
                        this.text = ''
                        this.state = 9
                        break
                    }
                    if (Lexer.isBinaryCharacter(c)) {
                        this.text = ''
                        this.state = 12
                        break
                    }
                    throw Error(`Unknown character '${c}'`)
                case 9: // #<alpha>...
                    if (c == ":") {
                        this.state = 10
                        break
                    }
                    if (Lexer.isAlphaNumeric(c)) {
                        break
                    }
                    this.ungetc()
                    this.state = 0
                    const lastColon = this.text!.lastIndexOf(":")
                    if (lastColon !== -1) {
                        for (let i = lastColon; i < this.text!.length; ++i) {
                            this.ungetc()
                        }
                        this.text = this.text!.substring(0, lastColon + 1)
                    }
                    return new Node(Type.TKN_QUOTED_SELECTOR, this.text)
                case 10:
                    if (Lexer.isAlphaNumeric(c)) {
                        this.state = 9
                        break
                    }
                    this.ungetc()
                    this.state = 0
                    return new Node(Type.TKN_QUOTED_SELECTOR, this.text)
                case 12: // #<binaryCharacter>...
                    if (Lexer.isBinaryCharacter(c)) {
                        break
                    }
                    this.ungetc()
                    this.state = 0
                    return new Node(Type.TKN_QUOTED_SELECTOR, this.text)
                case 13: // #'...
                    if (c === '\'') {
                        this.state = 14
                        continue
                    }
                    break
                case 14: // #'...'
                    if (c === '\'') {
                        this.state = 13
                        break
                    }
                    this.ungetc()
                    this.state = 0
                    return new Node(Type.TKN_HASHED_STRING, this.text)
                case 20: // {digit}?
                    if (c === 'r') {
                        this.radix = parseInt(this.text!)
                        this.numericText = ""
                        this.state = 21
                        break
                    }
                    if (c === '.') {
                        this.state = 22
                        break
                    }
                    if (!Lexer.isDigit(c)) {
                        this.ungetc()
                        this.state = 0
                        return new Node(Type.TKN_NUMBER, this.text, parseInt(this.text!))
                    }
                    break
                case 21: // {digits}r?
                    if (!Lexer.isDigit(c) && !Lexer.isUppercaseAlpha(c)) {
                        this.ungetc()
                        this.state = 0
                        return new Node(Type.TKN_NUMBER, this.text, parseInt(this.numericText!, this.radix))
                    }
                    this.numericText += c
                    break
                case 22: // {digits}.?
                    if (!Lexer.isDigit(c)) {
                        this.ungetc()
                        this.ungetc()
                        this.state = 0
                        return new Node(Type.TKN_NUMBER, this.text, parseFloat(this.text!))
                    }
                    this.state = 23
                    break
                case 23: // {digits}.{digits}?
                    // e: float, d: double
                    if (c === 'e' || c === 'd' || c === 'q') {
                        this.state = 24
                        this.numericText = this.text + 'e'
                        this.text += c
                        continue
                    }
                    if (!Lexer.isDigit(c)) {
                        this.ungetc()
                        this.state = 0
                        return new Node(Type.TKN_NUMBER, this.text, parseFloat(this.text!))
                    }
                    break
                case 24: // {digits}.{digits}(e|d|q)?
                    if (c !== '-' && !Lexer.isDigit(c)) {
                        throw Error(`failed to parse float: expected '-' or number after ${this.text} but got '${c}'`)
                    }
                    this.numericText += c
                    this.state = 25
                    break
                case 25: // {digits}.{digits}(e|d|q)[-]{digit}?
                    if (!Lexer.isDigit(c)) {
                        this.ungetc()
                        this.state = 0
                        return new Node(Type.TKN_NUMBER, this.text, parseFloat(this.numericText))
                    }
                    this.numericText += c
                    break
            }
            if (eof) {
                if (this.state !== 0) {
                    throw Error(`unexpected end of file at char ${c}`)
                }
                return undefined
            }
            if (oldstate == 0) {
                this.text = c
            } else {
                this.text += c
            }
        }
    }
}
