import { expect, it, describe } from "vitest"
import { Lexer } from "../src/compiler/lexer"
import { Type } from "../src/compiler/type"

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
    describe("3.4.6 literal", () => {
        describe("3.5.6 numbers", () => {
            // {uint}
            // {radix}r{alphanumeric}
            // {uint}.{uint}
            // {uint}.{uint}(e|d|q)[-]{uint}

            describe("integer", () => {
                it("42", () => {
                    const node = new Lexer("42a").lex()
                    expect(node?.type).toBe(Type.TKN_NUMBER)
                    expect(node?.text).toBe("42")
                    expect(node?.number).toBe(42)
                })
            })
            describe("radix", () => {
                it("16rFF", () => {
                    const node = new Lexer("16rFFff").lex()
                    expect(node?.type).toBe(Type.TKN_NUMBER)
                    expect(node?.text).toBe("16rFF")
                    expect(node?.number).toBe(255)
                })
            })
            describe("float", () => {
                it("3.1415", () => {
                    const node = new Lexer("3.1415a").lex()
                    expect(node?.type).toBe(Type.TKN_NUMBER)
                    expect(node?.text).toBe("3.1415")
                    expect(node?.number).toBe(3.1415)
                })
                it("1.2e10", () => {
                    const node = new Lexer("1.2e10a").lex()
                    expect(node?.type).toBe(Type.TKN_NUMBER)
                    expect(node?.text).toBe("1.2e10")
                    expect(node?.number).toBe(1.2e10)
                })
                it("1.2e-10", () => {
                    const node = new Lexer("1.2e-10a").lex()
                    expect(node?.type).toBe(Type.TKN_NUMBER)
                    expect(node?.text).toBe("1.2e-10")
                    expect(node?.number).toBe(1.2e-10)
                })
                it("1.2d10", () => {
                    const node = new Lexer("1.2d10a").lex()
                    expect(node?.type).toBe(Type.TKN_NUMBER)
                    expect(node?.text).toBe("1.2d10")
                    expect(node?.number).toBe(1.2e10)
                })
                it("1.2q10", () => {
                    const node = new Lexer("1.2q10a").lex()
                    expect(node?.type).toBe(Type.TKN_NUMBER)
                    expect(node?.text).toBe("1.2q10")
                    expect(node?.number).toBe(1.2e10)
                })
                it("1. ", () => {
                    const lexer = new Lexer("1. ")
                    expect(lexer.lex()?.type).to.equal(Type.TKN_NUMBER)
                    expect(lexer.lex()?.type).to.equal(Type.TKN_DOT)
                })
            })
            // scaledDecimal
        })
        describe("3.5.7 quoted character", () => {
            it("$a", () => {
                const node = new Lexer("$a1'").lex()
                expect(node?.type).toBe(Type.TKN_CHARACTER)
                expect(node?.text).toBe("a")
            })
            it("$@.", () => {
                const lexer = new Lexer("$@.")

                let node = lexer.lex()
                expect(node?.type).toBe(Type.TKN_CHARACTER)
                expect(node?.text).toBe("@")

                node = lexer.lex()
                expect(node?.type).toBe(Type.TKN_DOT)
                expect(node?.text).toBe(".")
            })
        })
        describe("3.5.8 quoted string", () => {
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
        describe("3.5.9 hashedString", () => {
            it("within single ticks", () => {
                const node = new Lexer("#'hello'").lex()
                expect(node?.type).toBe(Type.TKN_HASHED_STRING)
                expect(node?.text).toBe("hello")
            })
            it("double ticks inside become a single tick", () => {
                const node = new Lexer("#'hel''lo'").lex()
                expect(node?.type).toBe(Type.TKN_HASHED_STRING)
                expect(node?.text).toBe("hel'lo")
            })
        })
        describe("3.5.10 quotedSelector", () => {
            it("unarySelector", () => {
                const node = new Lexer("#hello<").lex()
                expect(node?.type).toBe(Type.TKN_QUOTED_SELECTOR)
                expect(node?.text).toBe("hello")
            })
            it("binarySelector", () => {
                const node = new Lexer("#<=a").lex()
                expect(node?.type).toBe(Type.TKN_QUOTED_SELECTOR)
                expect(node?.text).toBe("<=")
            })
            it("keywordSelector", () => {
                const node = new Lexer("#a:b:uvw+").lex()
                expect(node?.type).toBe(Type.TKN_QUOTED_SELECTOR)
                expect(node?.text).toBe("a:b:")
            })
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
        it("_ (Pre-ANSI)", () => {
            const node = new Lexer("←").lex()
            expect(node?.type).toBe(Type.TKN_ASSIGNMENT)
        })
        it("← (Pre-ANSI symbol in UTF-8)", () => {
            const node = new Lexer("←").lex()
            expect(node?.type).toBe(Type.TKN_ASSIGNMENT)
        })
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
            expect(n0?.type).toBe(Type.TKN_NUMBER)
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
            expect(n1?.type).toBe(Type.TKN_NUMBER)
            expect(n1?.text).toBe("7")

            const n2 = lexer.lex()
            expect(n2?.type).toBe(Type.TKN_RIGHT_SQUARE_BRACKET)

            const n3 = lexer.lex()
            expect(n3).toBe(undefined)
        })
    })
})
