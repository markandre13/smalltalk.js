import { it, describe } from "vitest"
import { method_definition, program, setLexer } from "../src/parser"

import { compile } from "../src/compile"
import { makeGlobalScope } from "../src/evaluate"
import { ST_Scope } from "../src/classes/ST_Scope"
import { ST_Number } from "../src/classes/ST_Number"


describe("playground", () => {
    describe("method definition", () => {
        // it.only("return", () => {
        //     setLexer(`|x y deltaPoint | x + deltaPoint x @ (y + deltaPoint y)`)
        //     const node = program()
        //     node?.printTree()
        //     const code = compile(node)
        //     console.log(code)
        // })

        // it("XXX", () => {
        //     const lexer = setLexer(`| deltaPoint | ^ x + deltaPoint x`)
        //     const node = program()
        //     node?.printTree()
        //     if (!lexer.eof()) {
        //         console.log(`UNPARSED: ${lexer.unparsed()}`)
        //     }
        //     const global = makeGlobalScope()
        //     const obj = new ST_Scope(global)
        //     obj.set("x", new ST_Number(5))
        //     obj.set("y", new ST_Number(7))

        //     const code = compile(node, obj)
        //     console.log(code)
        // })

        // Point has these methods:
        // x       get x
        // x:      set x
        // y       get x
        // y:      set x
        // asPoint returns this/self

        // Number has the binary message @ which returns a point, e.g.  1 @ 2 -> Point x: 1 y: 2

        // are x and y variables or methods? does it depend on the object the method belongs to?
        // ↑x + deltaPoint x @ (y + deltaPoint y)
        // ↑x     + deltaPoint x @ (y + deltaPoint y)
        // this.x + deltaPoint.x()    this.y + deltaPoint.y

        it("Point +", () => {
            const lexer = setLexer(`+ delta 
        "Answer a new Point that is the sum of the receiver and delta (which is a Point 
        or Number)."

        | deltaPoint |
        deltaPoint ← delta asPoint.
        ↑x + deltaPoint x @ (y + deltaPoint y)`)
            const node = method_definition()
            // node?.printTree()
            if (!lexer.eof()) {
                console.log(`UNPARSED: ${lexer.unparsed()}`)
            }
            // node?.printTree()

            const global = makeGlobalScope()
            const obj = new ST_Scope(global)
            obj.set("x", new ST_Number(5))
            obj.set("y", new ST_Number(7))

            const code = compile(node, obj)
            console.log(code)

            // ;let deltaPoint;deltaPoint=(delta).asPoint();return ((x)._add(deltaPoint)).@((y)._add(deltaPoint));
            // ;let deltaPoint;deltaPoint=(delta).asPoint();return ((x)._add(deltaPoint.x)).@((y)._add(deltaPoint.y));
        })
    })
})
