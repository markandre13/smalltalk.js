import { expect, it, describe, xit } from "bun:test"
import { expression, program, setLexer } from "../src/parser"
import { cascade_messages, compile } from "../src/compile"
import { ST_Number } from "../src/classes/ST_Number"
import { ST_String } from "../src/classes/ST_String"
import { ST_Transcript } from "../src/classes/ST_Transcript"

if (typeof window !== "undefined") {
    console.log("Client-side code")
} else {
    // console.log("Server-side code")
    const g = global as any
    g.ST_Number = ST_Number
    g.ST_String = ST_String
    g.ST_Transcript = ST_Transcript
    g.cascade_messages = cascade_messages
}

describe("compile", () => {
    describe("construct native types", () => {
        it("integer", () => {
            setLexer("1")
            const node = expression()
            const r = compile(node!)
            // console.log(r)
            expect(r).toBe("new ST_Number(1)")
        })
        xit("float", () => {
            setLexer("3.1415")
            const node = expression()
            const r = compile(node!)
            // console.log(r)
            expect(r).toBe("new ST_Number(3.1415)")
        })
        it("string", () => {
            setLexer("'hello'")
            const node = expression()
            const r = compile(node!)
            // console.log(r)
            expect(r).toBe("new ST_String('hello')")
        })
    })
    describe("number operations", () => {
        it("1 + 3", () => {
            setLexer("1 + 3")
            const node = expression()
            const code = compile(node!)
            expect(code).toEqual("(new ST_Number(1))._add(new ST_Number(3))")

            const result = new Function(`return ${code}`)()
            expect(result.value).toBe(4)
        })

        it("2 sin", () => {
            setLexer("2 sin")
            const node = expression()
            const code = compile(node!)
            expect(code).toEqual("(new ST_Number(2)).sin()")

            const result = new Function(`return ${code}`)()
            expect(result.value).toBe(0.9092974268256817)
        })

        it("2 * 3", () => {
            setLexer("2 * 3")
            const node = expression()
            const code = compile(node!)
            expect(code).toEqual("(new ST_Number(2))._mul(new ST_Number(3))")

            const result = new Function(`return ${code}`)()
            expect(result.value).toBe(6)
        })

        it("10 - 3", () => {
            setLexer("10 - 3")
            const node = expression()
            const code = compile(node!)
            expect(code).toEqual("(new ST_Number(10))._sub(new ST_Number(3))")

            const result = new Function(`return ${code}`)()
            expect(result.value).toBe(7)
        })

        it("8 / 2", () => {
            setLexer("8 / 2")
            const node = expression()
            const code = compile(node!)
            expect(code).toEqual("(new ST_Number(8))._div(new ST_Number(2))")

            const result = new Function(`return ${code}`)()
            expect(result.value).toBe(4)
        })

        it("8 / 2 + 6", () => {
            setLexer("8 / 2 + 6")
            const node = expression()
            const code = compile(node!)
            expect(code).toEqual("((new ST_Number(8))._div(new ST_Number(2)))._add(new ST_Number(6))")

            const result = new Function(`return ${code}`)()
            expect(result.value).toBe(10)
        })
    })
    describe("cascaded messages", () => {

        it("2 + 3 ; - 1", () => {
            setLexer("2 + 3 ; - 1")
            const node = expression()

            const code = compile(node!)
            expect(code).toEqual("cascade_messages(new ST_Number(2),($_)=>($_)._add(new ST_Number(3)),($_)=>($_)._sub(new ST_Number(1)))")

            const result = new Function(`return ${code}`)()
            expect(result.value).toBe(1)
        })

        // 2 + 3     * 4 ;            - 1
        // ( 2 + 3 ) * 4 ; ( 2 + 3 ) ; -1
        // 20            ; 4
        it("2 + 3 * 4 ; - 1", () => {
            setLexer("2 + 3 * 4 ; - 1")
            const node = expression()

            const code = compile(node!)
            expect(code).toEqual("cascade_messages((new ST_Number(2))._add(new ST_Number(3)),($_)=>($_)._mul(new ST_Number(4)),($_)=>($_)._sub(new ST_Number(1)))")

            const result = new Function(`return ${code}`)()
            expect(result.value).toBe(4)
        })

        it("2 + 3 * 4 * 2 ; + 1", () => {
            setLexer("2 + 3 * 4 * 2 ; + 1")
            const node = expression()

            const code = compile(node!)
            expect(code).toEqual("cascade_messages(((new ST_Number(2))._add(new ST_Number(3)))._mul(new ST_Number(4)),($_)=>($_)._mul(new ST_Number(2)),($_)=>($_)._add(new ST_Number(1)))")

            const result = new Function(`return ${code}`)()
            expect(result.value).toBe(21)
        })

        it("1 + 3 * 4 ; + 5 ; + 6", () => {
            setLexer("1 + 3 * 4 ; + 5 ; + 6")
            const node = expression()

            const code = compile(node!)
            expect(code).toEqual("cascade_messages((new ST_Number(1))._add(new ST_Number(3)),($_)=>($_)._mul(new ST_Number(4)),($_)=>($_)._add(new ST_Number(5)),($_)=>($_)._add(new ST_Number(6)))")

            const result = new Function(`return ${code}`)()
            expect(result.value).toBe(10)
        })

        // ANSI Smalltalk allows multiple messages after ';' but I haven't found
        // an implementation actually resolving this without an error message.
        // but 1 + 3 + 7 + 8 = 19 looks reasonable
        it("1 + 3 * 4 ; + 5 + 6 ; + 7 + 8", () => {
            setLexer("1 + 3 * 4 ; + 5 + 6 ; + 7 + 8")
            const node = expression()

            const code = compile(node!)
            expect(code).toEqual("cascade_messages((new ST_Number(1))._add(new ST_Number(3)),($_)=>($_)._mul(new ST_Number(4)),($_)=>(($_)._add(new ST_Number(5)))._add(new ST_Number(6)),($_)=>(($_)._add(new ST_Number(7)))._add(new ST_Number(8)))")

            const result = new Function(`return ${code}`)()
            expect(result.value).toBe(19)
        })
    })
    describe("parenthesis", () => {
        it("( 1 + 2 ) * 3", () => {
            setLexer("( 1 + 2 ) * 3")
            const node = expression()
            const code = compile(node!)
            expect(code).toEqual("((new ST_Number(1))._add(new ST_Number(2)))._mul(new ST_Number(3))")

            const result = new Function(`return ${code}`)()
            expect(result.value).toBe(9)
        })

        it("1 * ( 2  + 3 )", () => {
            setLexer("1 * ( 2  + 3 )")
            const node = expression()
            const code = compile(node!)
            expect(code).toEqual("(new ST_Number(1))._mul((new ST_Number(2))._add(new ST_Number(3)))")

            const result = new Function(`return ${code}`)()
            expect(result.value).toBe(5)
        })
    })
    describe("variables", () => {
        // | a |
        // a := 'hello world'
        // Transcript show: a; cr.

        it("a := 7", () => {
            setLexer("a := 7")
            const node = expression()
            node?.printTree()
            const code = compile(node!)
            console.log(code)
            expect(code).toEqual("a=new ST_Number(7)")
            // const result = new Function(`return ${code}`)()
            // expect(result.value).toBe(4)
        })

        it.only("| a |", () => {
            // setLexer("|a| a := 1. Transcript show: a.")
            setLexer("Array new.")
            const node = program()
            node?.printTree()
            const code = compile(node!)
            console.log(code)
            // expect(code).toEqual("a=new ST_Number(7)")
            // const result = new Function(`return ${code}`)()
            // expect(result.value).toBe(4)
        })
        it("| a  b |", () => {
            setLexer("|a b| a := 1. b := 2.")
            const node = program()
            node?.printTree()
            const code = compile(node!)
            console.log(code)
            // expect(code).toEqual("a=new ST_Number(7)")
            // const result = new Function(`return ${code}`)()
            // expect(result.value).toBe(4)
        })

        // it("set variable: a := 7", () => {
        //     setLexer("a := 7")
        //     const node = expression()

        //     expect(node?.type).toBe(Type.TKN_ASSIGNMENT)
        //     expect(node?.child[0]?.type).toBe(Type.TKN_IDENTIFIER)
        //     expect(node?.child[1]?.type).toBe(Type.SYN_EXPRESSION)
        //     expect(node?.child[1]?.child[0]?.type).toBe(Type.TKN_INTEGER)
        //     expect(node?.child[1]?.child[0]?.text).toBe("7")

        //     const scope = new ST_Scope()
        //     evaluate(node!, scope)
        //     expect(scope.get("a").value).toBe(7)
        // })
        // it("read variable: a := 7. a + 3.", () => {
        //     setLexer("a := 7. a + 3.")
        //     const node = program()
        //     const r = evaluate(node!)
        //     expect(r.value).toBe(10)
        // })
    })

    describe("statements", () => {
        it("the result of the last statement is returned: 1. 2.", () => {
            setLexer("1. 2.")
            const node = program()
            // node?.printTree()
            const code = compile(node!)
            expect(code).toEqual("new ST_Number(1);return new ST_Number(2);")
            // console.log(code)

            const result = new Function(`${code}`)()
            // console.log(result)
            expect(result.value).toBe(2)
        })

        // it("all statements are evaluated: a:='hello'. b:='world'.", () => {
        //     setLexer("a:='hello'. b:='world'.")
        //     const node = program()
        //     const scope = new ST_Scope()
        //     const r = evaluate(node!, scope)
        //     expect(r.value).toBe('world')
        //     expect(scope.get("a").value).toBe("hello")
        //     expect(scope.get("b").value).toBe("world")
        // })
    })
})
