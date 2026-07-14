import { it, describe, expect } from "vitest"
import { expression, method_definition, program, setLexer } from "../src/parser"
import { compile } from "../src/compile"
import { makeGlobalScope } from "../src/evaluate"
import { ST_Scope } from "../src/classes/ST_Scope"
import { ST_Number } from "../src/classes/ST_Number"
import { expectNodeTree } from "./detail/expectNodeTree"
import { Type } from "../src/type"


describe("playground", () => {
    // describe("compile", () => {
    //     describe("basic_expression", () => {
    //         it("1 u", () => {
    //             setLexer("1 u")
    //             const node = expression()!
    //             const code = compile(node)
    //             expect(code).toEqual("(new ST_Number(1)).u()")
    //         })
    //         it("1 a b c", () => {
    //             setLexer("1 a b c")
    //             const node = expression()!
    //             const code = compile(node)
    //             expect(code).toEqual("(new ST_Number(1)).a().b().c()")
    //         })
    //         describe("binary messages", () => {
    //             it("1 + 3", () => {
    //                 setLexer("1 + 3")
    //                 const node = expression()!
    //                 const code = compile(node)
    //                 expect(code).toEqual("(new ST_Number(1))._add(new ST_Number(3))")
    //             })
    //             it("1 + 2 + 3 + 4", () => {
    //                 setLexer("1 + 2 + 3 + 4")
    //                 const node = expression()!
    //                 const code = compile(node)
    //                 expect(code).toEqual("(new ST_Number(1))._add(new ST_Number(2))._add(new ST_Number(3))._add(new ST_Number(4))")
    //             })
    //         })
    //         describe("keyword messages", () => {
    //             it("1 a: 2 b: 3", () => {
    //                 setLexer("1 a: 2 b: 3")
    //                 const node = expression()!
    //                 const code = compile(node)
    //                 expect(code).toEqual("(new ST_Number(1)).a_b_(new ST_Number(2),new ST_Number(3))")
    //             })
    //             it("1 a: 2 u + 3 b: 4", () => {
    //                 setLexer("1 a: 2 u + 3 b: 4")
    //                 const node = expression()!
    //                 const code = compile(node)
    //                 expect(code).toEqual("(new ST_Number(1)).a_b_((new ST_Number(2)).u()._add(new ST_Number(3)),new ST_Number(4))")
    //             })
    //         })
    //         describe("combined unary binary keyword messages", () => {
    //             it("1 a b c + 2 + 3 + 4 u: 5 v: 6", () => {
    //                 setLexer("1 a b c + 2 + 3 + 4 u: 5 v: 6")
    //                 const node = expression()!
    //                 const code = compile(node)
    //                 expect(code).toEqual("(new ST_Number(1)).a().b().c()._add(new ST_Number(2))._add(new ST_Number(3))._add(new ST_Number(4)).u_v_(new ST_Number(5),new ST_Number(6))")
    //             })
    //             it("1 a b c + 2 + 3 + 4 u: 5 d e + 6 + 7 v: 8", () => {
    //                 setLexer("1 a b c + 2 + 3 + 4 u: 5 d e + 6 + 7 v: 8")
    //                 const node = expression()!
    //                 const code = compile(node)
    //                 expect(code).toEqual("(new ST_Number(1)).a().b().c()._add(new ST_Number(2))._add(new ST_Number(3))._add(new ST_Number(4)).u_v_((new ST_Number(5)).d().e()._add(new ST_Number(6))._add(new ST_Number(7)),new ST_Number(8))")
    //             })
    //         })
    //         describe("cascaded messages", () => {
    //             it("2 + 3 ; - 1", () => {
    //                 setLexer("2 + 3 ; - 1")
    //                 const node = expression()!
    //                 const code = compile(node)
    //                 expect(code).toEqual("{let _tmp=new ST_Number(2);(_tmp)._add(new ST_Number(3));(_tmp)._sub(new ST_Number(1))}")
    //             })
    //             it("2 + 3 * 4 ; - 5", () => {
    //                 setLexer("2 + 3 * 4 ; - 5")
    //                 const node = expression()!
    //                 const code = compile(node)
    //                 expect(code).toEqual("{let _tmp=(new ST_Number(2))._add(new ST_Number(3));(_tmp)._mul(new ST_Number(4));(_tmp)._sub(new ST_Number(5))}")
    //             })
    //             it("2 + 3 * 4 * 2 ; + 1", () => {
    //                 setLexer("2 + 3 * 4 * 2 ; + 1")
    //                 const node = expression()!
    //                 const code = compile(node)
    //                 expect(code).toEqual("{let _tmp=(new ST_Number(2))._add(new ST_Number(3))._mul(new ST_Number(4));(_tmp)._mul(new ST_Number(2));(_tmp)._add(new ST_Number(1))}")
    //             })
    //             it("1 + 2 * 3 ; a + 4 b: 5 ; c + 6 d: 7", () => {
    //                 setLexer("1 + 2 * 3 ; a + 4 b: 5 ; c + 6 d: 7")
    //                 const node = expression()!
    //                 const code = compile(node)
    //                 expect(code).toEqual("{let _tmp=(new ST_Number(1))._add(new ST_Number(2));(_tmp)._mul(new ST_Number(3));(_tmp).a()._add(new ST_Number(4)).b_(new ST_Number(5));(_tmp).c()._add(new ST_Number(6)).d_(new ST_Number(7))}")
    //             })
    //         })

    //     })
    //     describe("statements", () => {
    //         it("1 a. 2 b.", () => {
    //             setLexer("1 a. 2 b.")
    //             const node = program()
    //             const code = compile(node)
    //             expect(code).to.equal("(new ST_Number(1)).a();return (new ST_Number(2)).b();")
    //         })
    //         it("a := 1 + 2 + 3", () => {
    //             setLexer("a := 1 + 2 + 3")
    //             const node = program()
    //             const code = compile(node)
    //             expect(code).to.equal("a=(new ST_Number(1))._add(new ST_Number(2))._add(new ST_Number(3));return a;")
    //         })
    //         it("^ 1 + 2 + 3", () => {
    //             setLexer("^ 1 + 2 + 3")
    //             const node = program()
    //             const code = compile(node)
    //             expect(code).to.equal("return (new ST_Number(1))._add(new ST_Number(2))._add(new ST_Number(3));")
    //         })
    //         it("assign cascaded message: a := 1 + 2 ; + 3 ; + 4.", () => {
    //             setLexer("a := 1 + 2 ; + 3 ; + 4.")
    //             const node = program()
    //             const code = compile(node)
    //             expect(code).to.equal("{let _tmp=new ST_Number(1);(_tmp)._add(new ST_Number(2));(_tmp)._add(new ST_Number(3));a=(_tmp)._add(new ST_Number(4))};return a;")
    //         })
    //         it("return cascaded message: ^ 1 + 2 ; + 3 ; + 4.", () => {
    //             setLexer("^ 1 + 2 ; + 3 ; + 4.")
    //             const node = program()
    //             const code = compile(node)
    //             expect(code).to.equal("{let _tmp=new ST_Number(1);(_tmp)._add(new ST_Number(2));(_tmp)._add(new ST_Number(3));return (_tmp)._add(new ST_Number(4))};")
    //         })
    //         it("block statement", () => {
    //             setLexer("[3. 5. 7]")
    //             const node = program()
    //             const code = compile(node)
    //             console.log(code)
    //             expect(code).to.equal("return ()=>{new ST_Number(3);new ST_Number(5);return new ST_Number(7)};")
    //         })
    //         // TODO: access object variables
    //         //    this would imply objects/classes
    //     })
    // })

    // it("1 + ( 2 a )", () => {
    //     setLexer(`1 + ( 2 a )`)
    //     const node = expression()!
    //     const code = compile(node)
    //     expect(code).to.equal("(new ST_Number(1))._add((new ST_Number(2)).a())")
    // })
    // it("1 + 2 a", () => {
    //     setLexer(`1 + 2 a`)
    //     const node = expression()!
    //     const code = compile(node)
    //     expect(code).to.equal("(new ST_Number(1))._add((new ST_Number(2)).a())")
    // })

    // it("|x y deltaPoint| x + deltaPoint x @ (y + deltaPoint y)", () => {
    //     setLexer(`|x y deltaPoint| x + deltaPoint x @ (y + deltaPoint y)`)
    //     const node = program()!
    //     const code = compile(node)
    //     expect(code).to.equal("let x,y,deltaPoint;return (x)._add((deltaPoint).x())._dot((y)._add((deltaPoint).y()));")
    // })

    it("x", () => {
        setLexer(`|deltaPoint| x + deltaPoint x @ (y + deltaPoint y)`)
        const node = program()!
        node.printTree()
        const scope = makeGlobalScope()
        const obj = new ST_Scope(scope)
        obj.set("x", ST_Scope.objectVariable)
        obj.set("y", ST_Scope.objectVariable)
        const code = compile(node, obj)
        console.log(code)
        // expect(code).to.equal("return this.x;")
    })

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
    // this.x + deltaPoint.x() @ this.y + deltaPoint.y

    // it("Point +", () => {
    //     const lexer = setLexer(`+ delta 
    // "Answer a new Point that is the sum of the receiver and delta (which is a Point 
    // or Number)."

    // | deltaPoint |
    // deltaPoint ← delta asPoint.
    // ↑x + deltaPoint x @ (y + deltaPoint y)`)
    //     const node = method_definition()
    //     // node?.printTree()
    //     if (!lexer.eof()) {
    //         console.log(`UNPARSED: ${lexer.unparsed()}`)
    //     }
    //     // node?.printTree()

    //     const global = makeGlobalScope()
    //     const obj = new ST_Scope(global)
    //     obj.set("x", new ST_Number(5))
    //     obj.set("y", new ST_Number(7))

    //     const code = compile(node, obj)
    //     console.log(code)

    //     // ;let deltaPoint;deltaPoint=(delta).asPoint();return ((x)._add(deltaPoint)).@((y)._add(deltaPoint));
    //     // ;let deltaPoint;deltaPoint=(delta).asPoint();return ((x)._add(deltaPoint.x)).@((y)._add(deltaPoint.y));
    // })

})
