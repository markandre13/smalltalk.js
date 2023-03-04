import { expect, it, describe } from "bun:test";
import { Lexer } from "./Lexer";
import { Type } from "./Type";

describe("lex", () => {
    describe("identifier", () => {
        it("alpha (a-z|A-Z)", () => {
            const node = new Lexer("azAZ").lex()
            expect(node?.type).toBe(Type.TKN_IDENTIFIER)
            expect(node?.text).toBe("azAZ")
        })
        it("numeric (0-9) after alpha", () => {
            const node = new Lexer("a09").lex()
            expect(node?.type).toBe(Type.TKN_IDENTIFIER)
            expect(node?.text).toBe("a09")
        })
    })
    describe("keyword", () => {
        // 3.5.4 Keywords
        // Keywords are identifiers used to create message selectors.
        //
        // Keywords are identifiers followed immediately by the colon character
        it("identifier: -> keyword", () => {
            const node = new Lexer("identifier:").lex()
            expect(node?.type).toBe(Type.TKN_KEYWORD)
            expect(node?.text).toBe("identifier:")
        })
        it("identifier:= -> identifier assignment", () => {
            const lexer = new Lexer("identifier:=")
            const n0 = lexer.lex()
            expect(n0?.type).toBe(Type.TKN_IDENTIFIER)
            expect(n0?.text).toBe("identifier")
            const n1 = lexer.lex()
            expect(n1?.type).toBe(Type.TKN_ASSIGNMENT)
        })
        // An unadorned identifier is an identifier which is not immediately preceded by a '#'.
        // If a ':' followed by an '=' immediately follows an unadorned identifier,
        // with no intervening white space,
        // then the token is to be parsed as an identifier followed by an assignmentOperator
        // not as an keyword followed by an '='.

        // :=

    })
    describe("string", () => {
        it("within single ticks", () => {
            const node = new Lexer("'hello'").lex()
            expect(node?.type).toBe(Type.TKN_STRING)
            expect(node?.text).toBe("hello")
        })
        it("double ticks inside become a single tick", () => {
            const node = new Lexer("'hel''lo'").lex()
            expect(node?.type).toBe(Type.TKN_STRING)
            expect(node?.text).toBe("hel'lo")
        })
    })
    describe("integer", () => {
        it("42", () => {
            const node = new Lexer("42").lex()
            expect(node?.type).toBe(Type.TKN_INTEGER)
            expect(node?.text).toBe("42")
        })
    })
    describe("binary", () => {
        it("+", () => {
            const node = new Lexer("+").lex()
            expect(node?.type).toBe(Type.TKN_BINARY)
            expect(node?.text).toBe("+")
        })
        it("-", () => {
            const node = new Lexer("*").lex()
            expect(node?.type).toBe(Type.TKN_BINARY)
            expect(node?.text).toBe("*")
        })
        it("*", () => {
            const node = new Lexer("*").lex()
            expect(node?.type).toBe(Type.TKN_BINARY)
            expect(node?.text).toBe("*")
        })
        it("/", () => {
            const node = new Lexer("/").lex()
            expect(node?.type).toBe(Type.TKN_BINARY)
            expect(node?.text).toBe("/")
        })
    })
    describe("return (↑)", () => {
        it("^", () => {
            const node = new Lexer("^").lex()
            expect(node?.type).toBe(Type.TKN_RETURN)
        })
    })
    describe("assignment (←)", () => {
        it(":= (ANSI)", () => {
            const node = new Lexer(":=").lex()
            expect(node?.type).toBe(Type.TKN_ASSIGNMENT)
        })
    })
    describe("multiple tokens", () => {
        it("string identifier", () => {
            const lexer = new Lexer("'hello' printNl")
            const n0 = lexer.lex()
            expect(n0?.type).toBe(Type.TKN_STRING)
            expect(n0?.text).toBe("hello")
            const n1 = lexer.lex()
            expect(n1?.type).toBe(Type.TKN_IDENTIFIER)
            expect(n1?.text).toBe("printNl")
            const n2 = lexer.lex()
            expect(n2).toBe(undefined)
        })
        it("number identifier", () => {
            const lexer = new Lexer("42 printNl")
            const n0 = lexer.lex()
            expect(n0?.type).toBe(Type.TKN_INTEGER)
            expect(n0?.text).toBe("42")
            const n1 = lexer.lex()
            expect(n1?.type).toBe(Type.TKN_IDENTIFIER)
            expect(n1?.text).toBe("printNl")
            const n2 = lexer.lex()
            expect(n2).toBe(undefined)
        })
        it(": identifier", () => {
            const lexer = new Lexer(":id")
            const n0 = lexer.lex()
            expect(n0?.type).toBe(Type.TKN_COLON)
            const n1 = lexer.lex()
            expect(n1?.type).toBe(Type.TKN_IDENTIFIER)
            expect(n1?.text).toBe("id")
            const n2 = lexer.lex()
            expect(n2).toBe(undefined)
        })
        it(":= identifier", () => {
            const lexer = new Lexer(":=id")
            const n0 = lexer.lex()
            expect(n0?.type).toBe(Type.TKN_ASSIGNMENT)
            const n1 = lexer.lex()
            expect(n1?.type).toBe(Type.TKN_IDENTIFIER)
            expect(n1?.text).toBe("id")
            const n2 = lexer.lex()
            expect(n2).toBe(undefined)
        })
        it("[ 7 ]", () => {
            const lexer = new Lexer("[ 7 ]")
            const n0 = lexer.lex()
            expect(n0?.type).toBe(Type.TKN_LEFT_SQUARE_BRACKET)

            const n1 = lexer.lex()
            expect(n1?.type).toBe(Type.TKN_INTEGER)
            expect(n1?.text).toBe("7")

            const n2 = lexer.lex()
            expect(n2?.type).toBe(Type.TKN_RIGHT_SQUARE_BRACKET)

            const n3 = lexer.lex()
            expect(n3).toBe(undefined)
        })
    })
})
