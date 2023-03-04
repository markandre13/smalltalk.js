import { Node } from "./Node";
import { Type } from "./Type";

export class Lexer {
    data: string;
    line: number;
    column: number;

    pos: number;
    state: number;
    text?: string;
    tokenStack: Array<Node>;

    static isAlpha(c: string): boolean {
        let n = c.charCodeAt(0);
        return (
            (0x41 <= n && n <= 0x5a) ||
            (0x61 <= n && n <= 0x7a)
        );
    }

    static isDigit(c: string): boolean {
        let n = c.charCodeAt(0);
        return (0x30 <= n && n <= 0x39);
    }

    static isAlphaNumeric(c: string): boolean {
        return Lexer.isAlpha(c) || Lexer.isDigit(c);
    }

    constructor(data: string) {
        this.data = data;
        this.line = 1;
        this.column = 1;
        this.pos = 0;
        this.state = 0;
        this.tokenStack = new Array<Node>();
    }

    eof(): boolean {
        return this.pos >= this.data.length;
    }

    getc(): string {
        let c = this.data[this.pos++];
        if (c == '\n') {
            ++this.line;
            this.column = 1;
        } else {
            ++this.column; // FIXME: tabulators
        }
        return c;
    }

    ungetc(): void {
        let c = this.data[--this.pos];
        if (c == '\n') {
            let i;
            for (i = this.pos; i > 0; --i) {
                if (this.data[i] == '\n')
                    break;
            }
            this.column = i;
            --this.line;
        } else {
            --this.column;
        }
    }

    unlex(token: Node | undefined): void {
        if (token === undefined)
            return;
        if (token.child.length !== 0)
            throw Error("can not unlex token " + token.toString() + " with children");
        // FIXME: adjust this.line and this.column
        this.tokenStack.push(token);
    }

    lex(): Node | undefined {
        if (this.tokenStack.length > 0) {
            return this.tokenStack.pop();
        }
        // console.log(`LEX: eof=${this.eof()}`)
        let eof = this.eof()
        while (!eof) {
            let c;
            if (this.eof()) {
                ++this.pos
                c = " ";
                eof = true;
            } else {
                c = this.getc();
            }
            // console.log(`state=${this.state} c='${c}', pos=${this.pos}`)
            let oldstate = this.state;
            switch (this.state) {
                case 0:
                    switch (c) {
                        case ' ':
                        case '\r':
                        case '\n':
                        case '\t':
                        case '\v':
                            break;
                        case '^':
                            return new Node(Type.TKN_RETURN);
                        case '!':
                        case '%':
                        case '&':
                        case '*':
                        case '+':
                        case ',':
                        case '/':
                        case '<':
                        case '=':
                        case '>':
                        case '?':
                        case '@':
                        case '\\':
                        case '~':
                        case '|':
                        case '-':
                            return new Node(Type.TKN_BINARY, c);
                        case ';':
                            return new Node(Type.TKN_SEMICOLON, c);
                        case '.':
                            return new Node(Type.TKN_DOT, c);
                        case '(':
                            return new Node(Type.TKN_LEFT_PARENTHESIS, c);
                        case ')':
                            return new Node(Type.TKN_RIGHT_PARENTHESIS, c);
                        case '[':
                            return new Node(Type.TKN_LEFT_SQUARE_BRACKET, c);
                        case ']':
                            return new Node(Type.TKN_RIGHT_SQUARE_BRACKET, c);
                        case '\'':
                            this.state = 2;
                            this.text = "";
                            continue;
                        case '"':
                            this.state = 5;
                            continue;
                        case ':':
                            this.state = 6;
                            continue;
                        default:
                            if (Lexer.isAlpha(c)) {
                                this.text = "";
                                this.state = 1;
                                break
                            }
                            if (Lexer.isDigit(c)) {
                                this.text = "";
                                this.state = 4;
                                break
                            }
                            throw Error(`Unknown character '${c}'`)
                    }
                    break;
                case 1: // a-z...
                    if (Lexer.isAlphaNumeric(c)) {
                        break;
                    }
                    if (c === ':') {
                        this.state = 11;
                        continue;
                    }
                    this.ungetc();
                    this.state = 0;
                    return new Node(Type.TKN_IDENTIFIER, this.text);
                case 11:
                    this.state = 0;
                    if (c === '=') {
                        this.unlex(new Node(Type.TKN_ASSIGNMENT));
                        return new Node(Type.TKN_IDENTIFIER, this.text);
                    }
                    this.ungetc();
                    return new Node(Type.TKN_KEYWORD, this.text + ":");
                case 2: // '...
                    if (c === '\'') {
                        this.state = 3;
                        continue;
                        // return new Node(Type.TKN_STRING, this.text)
                    }
                    break;
                case 3: // // '...'
                    if (c === '\'') {
                        this.state = 2;
                        break;
                    }
                    this.ungetc();
                    this.state = 0;
                    return new Node(Type.TKN_STRING, this.text);
                case 4:
                    if (!Lexer.isDigit(c)) {
                        this.ungetc();
                        this.state = 0;
                        return new Node(Type.TKN_INTEGER, this.text);
                    }
                    break;
                case 5:
                    if (c == '"') {
                        this.state = 0;
                        continue;
                    }
                    continue;
                case 6: // :...
                    this.state = 0
                    if (c === '=') {
                        return new Node(Type.TKN_ASSIGNMENT);
                    }
                    this.ungetc()
                    return new Node(Type.TKN_COLON);
            }
            if (eof) {
                if (this.state !== 0) {
                    throw Error(`unexpected end of file at char ${c}`);
                }
                return undefined;
            }
            if (oldstate == 0) {
                this.text = c;
            } else {
                this.text += c;
            }
        }
    }
}
