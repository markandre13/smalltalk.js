import { it, describe } from "vitest"
import { expression, method_definition, setLexer } from "../src/compiler/parser"
import { Type } from "../src/compiler/type"
import { expectNodeTree } from "./detail/expectNodeTree"

describe("parser", () => {
    describe("basic_expression", () => {
        describe("unary messages", () => {
            it("1 u", () => {
                setLexer("1 u")
                const node = expression()!
                expectNodeTree(node, [
                    [0, Type.SYN_EXPRESSION],
                    [1, Type.TKN_NUMBER, '1'],
                    [1, Type.SYN_MESSAGES],
                    [2, Type.SYN_UNARY, 'u'],
                ])
            })
            it("1 a b c", () => {
                setLexer("1 a b c")
                const node = expression()!
                expectNodeTree(node, [
                    [0, Type.SYN_EXPRESSION],
                    [1, Type.TKN_NUMBER, '1'],
                    [1, Type.SYN_MESSAGES],
                    [2, Type.SYN_UNARY, 'a'],
                    [2, Type.SYN_UNARY, 'b'],
                    [2, Type.SYN_UNARY, 'c'],
                ])
            })
        })
        describe("binary messages", () => {
            it("1 + 3", () => {
                setLexer("1 + 3")
                const node = expression()!
                expectNodeTree(node, [
                    [0, Type.SYN_EXPRESSION],
                    [1, Type.TKN_NUMBER, '1'],
                    [1, Type.SYN_MESSAGES],
                    [2, Type.TKN_BINARY, '+'],
                    [3, Type.TKN_NUMBER, '3'],
                ])
            })
            it("1 + 2 + 3 + 4", () => {
                setLexer("1 + 2 + 3 + 4")
                const node = expression()!
                expectNodeTree(node, [
                    [0, Type.SYN_EXPRESSION],
                    [1, Type.TKN_NUMBER, '1'],
                    [1, Type.SYN_MESSAGES],
                    [2, Type.TKN_BINARY, '+'],
                    [3, Type.TKN_NUMBER, '2'],
                    [2, Type.TKN_BINARY, '+'],
                    [3, Type.TKN_NUMBER, '3'],
                    [2, Type.TKN_BINARY, '+'],
                    [3, Type.TKN_NUMBER, '4'],
                ])
            })
        })
        describe("keyword messages", () => {
            it("1 a: 2 b: 3", () => {
                setLexer("1 a: 2 b: 3")
                const node = expression()!
                // node.printTree()
                expectNodeTree(node, [
                    [0, Type.SYN_EXPRESSION],
                    [1, Type.TKN_NUMBER, '1'],
                    [1, Type.SYN_MESSAGES],
                    [2, Type.TKN_KEYWORD, 'a:b:'],
                    [3, Type.TKN_NUMBER, '2'],
                    [3, Type.TKN_NUMBER, '3'],
                ])
            })
            it("1 a: 2 u + 3 b: 4", () => {
                setLexer("1 a: 2 u + 3 b: 4")
                const node = expression()!
                // node.printTree()
                expectNodeTree(node, [
                    [0, Type.SYN_EXPRESSION],
                    [1, Type.TKN_NUMBER, '1'],
                    [1, Type.SYN_MESSAGES],
                    [2, Type.TKN_KEYWORD, 'a:b:'],
                    [3, Type.SYN_EXPRESSION],
                    [4, Type.TKN_NUMBER, '2'],
                    [4, Type.SYN_MESSAGES,],
                    [5, Type.SYN_UNARY, 'u'],
                    [5, Type.TKN_BINARY, '+'],
                    [6, Type.TKN_NUMBER, '3'],
                    [3, Type.TKN_NUMBER, '4'],
                ])
            })
        })
        describe("combined unary binary keyword messages", () => {
            it("1 a b c + 2 + 3 + 4 u: 5 v: 6", () => {
                setLexer("1 a b c + 2 + 3 + 4 u: 5 v: 6")
                const node = expression()!
                // node.printTree()
                expectNodeTree(node, [
                    [0, Type.SYN_EXPRESSION],
                    [1, Type.TKN_NUMBER, '1'],
                    [1, Type.SYN_MESSAGES],

                    [2, Type.SYN_UNARY, 'a'],
                    [2, Type.SYN_UNARY, 'b'],
                    [2, Type.SYN_UNARY, 'c'],

                    [2, Type.TKN_BINARY, '+'],
                    [3, Type.TKN_NUMBER, '2'],
                    [2, Type.TKN_BINARY, '+'],
                    [3, Type.TKN_NUMBER, '3'],
                    [2, Type.TKN_BINARY, '+'],
                    [3, Type.TKN_NUMBER, '4'],

                    [2, Type.TKN_KEYWORD, 'u:v:'],
                    [3, Type.TKN_NUMBER, '5'],
                    [3, Type.TKN_NUMBER, '6'],
                ])
            })

            it("1 a b c + 2 + 3 + 4 u: 5 d e + 6 + 7 v: 8", () => {
                setLexer("1 a b c + 2 + 3 + 4 u: 5 d e + 6 + 7 v: 8")
                const node = expression()!
                expectNodeTree(node, [
                    [0, Type.SYN_EXPRESSION],
                    [1, Type.TKN_NUMBER, '1'],
                    [1, Type.SYN_MESSAGES],

                    [2, Type.SYN_UNARY, 'a'],
                    [2, Type.SYN_UNARY, 'b'],
                    [2, Type.SYN_UNARY, 'c'],

                    [2, Type.TKN_BINARY, '+'],
                    [3, Type.TKN_NUMBER, '2'],
                    [2, Type.TKN_BINARY, '+'],
                    [3, Type.TKN_NUMBER, '3'],
                    [2, Type.TKN_BINARY, '+'],
                    [3, Type.TKN_NUMBER, '4'],

                    [2, Type.TKN_KEYWORD, 'u:v:'],
                    [3, Type.SYN_EXPRESSION],
                    [4, Type.TKN_NUMBER, '5'],
                    [4, Type.SYN_MESSAGES],
                    [5, Type.SYN_UNARY, 'd'],
                    [5, Type.SYN_UNARY, 'e'],
                    [5, Type.TKN_BINARY, '+'],
                    [6, Type.TKN_NUMBER, '6'],
                    [5, Type.TKN_BINARY, '+'],
                    [6, Type.TKN_NUMBER, '7'],

                    [3, Type.TKN_NUMBER, '8'],
                ])
            })
        })

        describe("binary argument containing unary messages", () => {
            it("1 + ( 2 a )", () => {
                setLexer(`1 + ( 2 a )`)
                const node = expression()!
                expectNodeTree(node, [
                    [0, Type.SYN_EXPRESSION],
                    [1, Type.TKN_NUMBER, '1'],
                    [1, Type.SYN_MESSAGES],
                    [2, Type.TKN_BINARY, '+'],
                    [3, Type.SYN_EXPRESSION],
                    [4, Type.TKN_NUMBER, '2'],
                    [4, Type.SYN_MESSAGES],
                    [5, Type.SYN_UNARY, 'a'],
                ])
            })
            it("1 + 2 a", () => {
                setLexer(`1 + 2 a`)
                const node = expression()!
                expectNodeTree(node, [
                    [0, Type.SYN_EXPRESSION],
                    [1, Type.TKN_NUMBER, '1'],
                    [1, Type.SYN_MESSAGES],
                    [2, Type.TKN_BINARY, '+'],
                    [3, Type.SYN_EXPRESSION],
                    [4, Type.TKN_NUMBER, '2'],
                    [4, Type.SYN_MESSAGES],
                    [5, Type.SYN_UNARY, 'a'],
                ])
            })
        })

        describe("cascaded messages", () => {
            it("2 + 3 ; - 1", () => {
                setLexer("2 + 3 ; - 1")
                const node = expression()!
                expectNodeTree(node, [
                    [0, Type.SYN_EXPRESSION],
                    [1, Type.TKN_NUMBER, '2'],

                    [1, Type.SYN_MESSAGES],

                    [1, Type.SYN_MESSAGES],
                    [2, Type.TKN_BINARY, '+'],
                    [3, Type.TKN_NUMBER, '3'],

                    [1, Type.SYN_MESSAGES],
                    [2, Type.TKN_BINARY, '-'],
                    [3, Type.TKN_NUMBER, '1'],
                ])
            })
            it("2 + 3 * 4 ; - 1", () => {
                setLexer("2 + 3 * 4 ; - 1")
                const node = expression()!
                expectNodeTree(node, [
                    [0, Type.SYN_EXPRESSION],
                    [1, Type.TKN_NUMBER, '2'],

                    [1, Type.SYN_MESSAGES],
                    [2, Type.TKN_BINARY, '+'],
                    [3, Type.TKN_NUMBER, '3'],

                    [1, Type.SYN_MESSAGES],
                    [2, Type.TKN_BINARY, '*'],
                    [3, Type.TKN_NUMBER, '4'],

                    [1, Type.SYN_MESSAGES],
                    [2, Type.TKN_BINARY, '-'],
                    [3, Type.TKN_NUMBER, '1'],
                ])
            })
            it("2 + 3 * 4 * 2 ; + 1", () => {
                setLexer("2 + 3 * 4 * 2 ; + 1")
                const node = expression()!
                expectNodeTree(node, [
                    [0, Type.SYN_EXPRESSION],
                    [1, Type.TKN_NUMBER, '2'],

                    [1, Type.SYN_MESSAGES],
                    [2, Type.TKN_BINARY, '+'],
                    [3, Type.TKN_NUMBER, '3'],
                    [2, Type.TKN_BINARY, '*'],
                    [3, Type.TKN_NUMBER, '4'],

                    [1, Type.SYN_MESSAGES],
                    [2, Type.TKN_BINARY, '*'],
                    [3, Type.TKN_NUMBER, '2'],

                    [1, Type.SYN_MESSAGES],
                    [2, Type.TKN_BINARY, '+'],
                    [3, Type.TKN_NUMBER, '1'],
                ])
            })
            it("1 + 2 * 3 ; a + 4 b: 5 ; c + 6 d: 7", () => {
                setLexer("1 + 2 * 3 ; a + 4 b: 5 ; c + 6 d: 7")
                const node = expression()!
                expectNodeTree(node, [
                    [0, Type.SYN_EXPRESSION],
                    [1, Type.TKN_NUMBER, '1'],

                    [1, Type.SYN_MESSAGES],
                    [2, Type.TKN_BINARY, '+'],
                    [3, Type.TKN_NUMBER, '2'],

                    [1, Type.SYN_MESSAGES],
                    [2, Type.TKN_BINARY, '*'],
                    [3, Type.TKN_NUMBER, '3'],

                    [1, Type.SYN_MESSAGES],
                    [2, Type.SYN_UNARY, 'a'],
                    [2, Type.TKN_BINARY, '+'],
                    [3, Type.TKN_NUMBER, '4'],
                    [2, Type.TKN_KEYWORD, 'b:'],
                    [3, Type.TKN_NUMBER, '5'],

                    [1, Type.SYN_MESSAGES],
                    [2, Type.SYN_UNARY, 'c'],
                    [2, Type.TKN_BINARY, '+'],
                    [3, Type.TKN_NUMBER, '6'],
                    [2, Type.TKN_KEYWORD, 'd:'],
                    [3, Type.TKN_NUMBER, '7'],
                ])
            })
        })

        describe("parentheses", () => {
            it("xxx", () => {

            })
        })
    })
    describe("method_definition", () => {
        it("unary", () => {
            setLexer(`
                init
                    x := 4
            `)
            const node = method_definition()
            node?.printTree()
            expectNodeTree(node, [
                [0, Type.SYN_METHOD_DEFINITION],
                [1, Type.SYN_MESSAGE_PATTERN],
                [2, Type.SYN_UNARY, "init"],
                [1, Type.SYN_STATEMENTS],
                [2, Type.TKN_ASSIGNMENT],
                [3, Type.TKN_IDENTIFIER, 'x'],
                [3, Type.SYN_EXPRESSION],
                [4, Type.TKN_NUMBER, '4'],
            ])
        })
        it("binary", () => {
            setLexer(`
                < a
                    x < a.
            `)
            const node = method_definition()
            expectNodeTree(node, [
                [0, Type.SYN_METHOD_DEFINITION],
                [1, Type.SYN_MESSAGE_PATTERN],
                [2, Type.TKN_BINARY, "<"],
                [2, Type.TKN_IDENTIFIER, "a"],
                [1, Type.SYN_STATEMENTS],
                [2, Type.SYN_EXPRESSION],
                [3, Type.TKN_IDENTIFIER, 'x'],
                [3, Type.SYN_MESSAGES],
                [4, Type.TKN_BINARY, '<'],
                [5, Type.TKN_IDENTIFIER, 'a'],
            ])
        })
        it("keyword", () => {
            setLexer(`
                init: a
                    x := a
            `)
            const node = method_definition()
            node?.printTree()
            expectNodeTree(node, [
                [0, Type.SYN_METHOD_DEFINITION],
                [1, Type.SYN_MESSAGE_PATTERN],
                [2, Type.TKN_KEYWORD, "init:"],
                [2, Type.TKN_IDENTIFIER, "a"],
                [1, Type.SYN_STATEMENTS],
                [2, Type.TKN_ASSIGNMENT],
                [3, Type.TKN_IDENTIFIER, 'x'],
                [3, Type.SYN_EXPRESSION],
                [4, Type.TKN_IDENTIFIER, 'a'],
            ])
        })
    })
})
