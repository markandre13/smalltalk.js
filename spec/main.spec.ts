import { expect, it, describe } from "vitest"
import { Type } from "../src/type"
import { expression, message_pattern, program, setLexer } from "../src/parser"
import { ST_Array } from "../src/classes/ST_Array"
import { ST_Number } from "../src/classes/ST_Number"
import { ST_Scope } from "../src/classes/ST_Scope"
import { ST_String } from "../src/classes/ST_String"
import { ST_Transcript } from "../src/classes/ST_Transcript"
import { initialize } from "../src/initialize"
import { expectNodeTree } from "./detail/expectNodeTree"
import { compile } from "../src/compile"

// TODO
// [ ] classes
// [ ] $char
// [ ] selector
// [ ] #symbol (like strings but unique)
// [ ] true,false,nil
// [X] array Array new: 27. || #(1 2 3)

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

// Object -> Behaviour -> ClassDecription -> Class -> ,,,

// Magnitude


// TAASOF: ch8: The Dependency Mechanism

// GNU SmallTask Kernel

// Bag class >> new [

// ]


// Class comment
// Object

initialize()

describe("parse", () => {
    describe("messages", () => {
        it("'hello' printNl", () => {
            setLexer("'hello' printNl")
            const node = expression()!

            expectNodeTree(node, [
                [0, Type.SYN_EXPRESSION],
                [1, Type.TKN_STRING, 'hello'],
                [1, Type.SYN_MESSAGES],
                [2, Type.SYN_UNARY, "printNl"],
            ])

            const code = compile(node!)
            expect(code).to.equal("(new ST_String('hello')).printNl()")

            ST_Transcript.buffer = ""
            new Function(code)()
            expect(ST_Transcript.buffer).toBe("hello\n")
        })

        it("42 printNl", () => {
            setLexer("42 printNl")
            const node = expression()!

            expectNodeTree(node, [
                [0, Type.SYN_EXPRESSION],
                [1, Type.TKN_INTEGER, '42'],
                [1, Type.SYN_MESSAGES],
                [2, Type.SYN_UNARY, "printNl"],
            ])

            const code = compile(node!)
            expect(code).to.equal("(new ST_Number(42)).printNl()")

            ST_Transcript.buffer = ""
            new Function(code)()
            expect(ST_Transcript.buffer).toBe("42\n")
        })

        describe("loop", () => {
            it("1 to: 20 do: [:x | x printNl ]", () => {
                setLexer("1 to: 3 do: [:x | x printNl ]")
                const node = expression()!

                const code = compile(node!)
                expect(code).to.equal("(new ST_Number(1)).to_do_(new ST_Number(3),(x)=>(x).printNl())")

                ST_Transcript.buffer = ""
                new Function(code)()
                expect(ST_Transcript.buffer).toBe("1\n2\n3\n")
            })
            it("5 to: 15 by: 5 do: [:x | x printNl ]", () => {
                setLexer("5 to: 15 by: 5 do: [:x | x printNl ]")
                const node = expression()!

                const code = compile(node!)
                expect(code).to.equal("(new ST_Number(5)).to_by_do_(new ST_Number(15),new ST_Number(5),(x)=>(x).printNl())")

                ST_Transcript.buffer = ""
                new Function(code)()
                expect(ST_Transcript.buffer).toBe("5\n10\n15\n")
            })
            it("15 to: 5 by: -5 do: [:x | x printNl ]", () => {
                setLexer("15 to: 5 by: -5 do: [:x | x printNl ]")
                const node = expression()!

                const code = compile(node!)
                expect(code).to.equal("(new ST_Number(15)).to_by_do_(new ST_Number(5),new ST_Number(-5),(x)=>(x).printNl())")

                ST_Transcript.buffer = ""
                new Function(code)()
                expect(ST_Transcript.buffer).toBe("15\n10\n5\n")
            })
        })

        it("1 + 3", () => {
            setLexer("1 + 3")
            const node = program()
            const r = (Function(compile(node)))()
            expect(r.value).toBe(4)
        })

        it("2 * 3", () => {
            setLexer("2 * 3")
            const node = program()
            const r = (Function(compile(node)))()
            expect(r.value).toBe(6)
        })

        it("10 - 3", () => {
            setLexer("10 - 3")
            const node = program()
            const r = (Function(compile(node)))()
            expect(r.value).toBe(7)
        })

        it("8 / 2", () => {
            setLexer("8 / 2")
            const node = program()
            const r = (Function(compile(node)))()
            expect(r.value).toBe(4)
        })

        it("8 / 2 + 6", () => {
            setLexer("8 / 2 + 6")
            const node = program()
            const r = (Function(compile(node)))()
            expect(r.value).toBe(10)
        })
    })

    describe("cascaded messages", () => {

        it("2 + 3 ; - 1", () => {
            setLexer("2 + 3 ; - 1")
            const node = program()
            const r = (Function(compile(node)))()
            expect(r.value).toBe(1)
        })

        // 2 + 3     * 4 ;            - 1
        // ( 2 + 3 ) * 4 ; ( 2 + 3 ) ; -1
        // 20            ; 4
        it("2 + 3 * 4 ; - 1", () => {
            setLexer("2 + 3 * 4 ; - 1")
            const node = program()
            const r = (Function(compile(node)))()
            expect(r.value).toBe(4)
        })

        // 2 + 3 -> 5
        // 5 * 4 -> 20
        // 20 * 2 -> 40
        // 20 + 1 -> 21
        it("2 + 3 * 4 * 2 ; + 1", () => {
            setLexer("2 + 3 * 4 * 2 ; + 1")
            const node = program()
            const r = (Function(compile(node)))()
            expect(r.value).toBe(21)
        })

        // 1 + 3 -> 4
        // 4 * 4 -> 16
        // 4 + 5 -> 9
        // 4 + 6 -> 10
        it("1 + 3 * 4 ; + 5 ; + 6", () => {
            setLexer("1 + 3 * 4 ; + 5 ; + 6")
            const node = program()
            const r = (Function(compile(node)))()
            expect(r.value).toBe(10)
        })

        // ANSI Smalltalk allows multiple messages after ';' but I haven't found
        // an implementation actually resolving this without an error message.
        // but 1 + 3 + 7 + 8 = 19 looks reasonable
        it("1 + 3 * 4 ; + 5 + 6 ; + 7 + 8", () => {
            setLexer("1 + 3 * 4 ; + 5 + 6 ; + 7 + 8")
            const node = program()
            const r = (Function(compile(node)))()
            expect(r.value).toBe(19)
        })
    })

    describe("parenthesis", () => {
        it("( 1 + 2 ) * 3", () => {
            setLexer("( 1 + 2 ) * 3")
            const node = program()
            const r = (Function(compile(node)))()
            expect(r.value).toBe(9)
        })
        it("1 * ( 2  + 3 )", () => {
            setLexer("1 * ( 2  + 3 )")
            const node = program()
            const r = (Function(compile(node)))()
            expect(r.value).toBe(5)
        })
    })

    describe("statements", () => {
        it("the result of the last statement is returned (1. 2.)", () => {
            setLexer("1. 2.")
            const node = program()
            const r = (Function(compile(node)))()

            expect(r.value).toBe(2)
        })
        // FIXME: THIS NEEDS SOME OBJECT STUFF
        it.skip("all statements are evaluated (a:='hello'. b:='world'.)", () => {
            setLexer("a:='hello'. b:='world'.")
            const node = program()
            const scope = new ST_Scope()
            const r = (Function(compile(node, scope)))()
            expect(r.value).toBe('world')
            expect(scope.get("a").value).toBe("hello")
            expect(scope.get("b").value).toBe("world")
        })
    })

    describe.skip("variables", () => {
        it("set variable: a := 7", () => {
            setLexer("a := 7")
            const node = expression()

            const scope = new ST_Scope();
            (Function(compile(node, scope)))()
            expect(scope.get("a").value).toBe(7)
        })
        it("read variable: a := 7. a + 3.", () => {
            setLexer("a := 7. a + 3.")
            const node = program()
            const r = (Function(compile(node)))()
            expect(r.value).toBe(10)
        })
    })

    describe("code block", () => {
        it("[||]", () => {
            setLexer("[||]")
            const node = expression()
            // node?.printTree()
            expect(node?.type).toBe(Type.SYN_EXPRESSION)
            expect(node?.child[0]?.type).toBe(Type.SYN_BLOCK_CLOSURE)
            expect(node?.child[0]?.child).toHaveLength(0)
        })
        it("[|x|]", () => {
            setLexer("[|x|]")
            const node = expression()
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
            setLexer("[|x y|]")
            const node = expression()
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
            setLexer("[ ]")
            const node = expression()
            // node?.printTree()
            expect(node?.type).toBe(Type.SYN_EXPRESSION)
            expect(node?.child[0]?.type).toBe(Type.SYN_BLOCK_CLOSURE)
            expect(node?.child[0]?.child).toHaveLength(0)
            // const r = evaluate(node!)
            // expect(r instanceof ST_Closure).toBeTruthy()
        })

        it("[ :a | ]", () => {
            setLexer("[ :a | ]")
            const node = expression()
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
            setLexer("[ :a :b | ]")
            const node = expression()
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
            setLexer("[ 7 ]")
            const node = expression()
            // node?.printTree()
            expect(node?.type).toBe(Type.SYN_EXPRESSION)
            expect(node?.child[0]?.type).toBe(Type.SYN_BLOCK_CLOSURE)
            expect(node?.child[0]?.child).toHaveLength(1)
            expect(node?.child[0]?.child[0]?.type).toBe(Type.SYN_STATEMENTS)
            expect(node?.child[0]?.child[0]?.child[0]?.type).toBe(Type.SYN_EXPRESSION)
            expect(node?.child[0]?.child[0]?.child[0]?.child[0]?.type).toBe(Type.TKN_INTEGER)
            expect(node?.child[0]?.child[0]?.child[0]?.child[0]?.text).toBe("7")

            // const r = evaluate(node!)
            // expect(r instanceof ST_Closure).toBeTruthy()
        })

        it("[ 7. 3. ]", () => {
            setLexer("[ 7. 3. ]")
            const node = expression()
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
            setLexer("[ :a | b. c. ]")
            const node = expression()
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
            setLexer("[ :a | |b| c]")
            const node = expression()
            // node?.printTree()
            expect(node?.type).toBe(Type.SYN_EXPRESSION)
            expect(node?.child[0]?.type).toBe(Type.SYN_BLOCK_CLOSURE)
            expect(node?.child[0]?.child).toHaveLength(3)
            expect(node?.child[0]?.child[0]?.type).toBe(Type.SYN_BLOCK_ARGUMENTS)
            expect(node?.child[0]?.child[1]?.type).toBe(Type.SYN_TEMPORARIES)
            expect(node?.child[0]?.child[2]?.type).toBe(Type.SYN_STATEMENTS)

            // const r = evaluate(node!)
            // expect(r instanceof ST_Closure).toBeTruthy()
        })

        it("[ :x | x + 7 ]", () => {
            setLexer("[ :x | x + 7 ]") // a  = (x) => { return x + 1 } ; a.call(undefined, 3)
            const node = expression()

            expect(node?.type).toBe(Type.SYN_EXPRESSION)
            const basic_expression = node!
            expect(basic_expression.child[0]?.type).toBe(Type.SYN_BLOCK_CLOSURE)
            const block_closure = basic_expression.child[0]!
            expect(block_closure.child[0]?.type).toBe(Type.SYN_BLOCK_ARGUMENTS)

            const args = block_closure.child[0]!
            expect(args.child[0]?.type).toBe(Type.TKN_IDENTIFIER)
            expect(args.child[0]?.text).toBe("x")

            expect(block_closure.child[1]?.type).toBe(Type.SYN_STATEMENTS)
            const bodyExpr = block_closure.child[1]?.child[0]
            expect(bodyExpr?.child[0]?.type).toBe(Type.TKN_IDENTIFIER)
            expect(bodyExpr?.child[0]?.text).toBe("x")
            expect(bodyExpr?.child[1]?.type).toBe(Type.SYN_MESSAGES)
            expect(bodyExpr?.child[1]?.child[0]?.type).toBe(Type.TKN_BINARY)
            expect(bodyExpr?.child[1]?.child[0]?.text).toBe("+")
            expect(bodyExpr?.child[1]?.child[0]?.child[0]?.type).toBe(Type.TKN_INTEGER)
            expect(bodyExpr?.child[1]?.child[0]?.child[0]?.text).toBe("7")
        })

        it("|a| a := [ 7 ]. a value.", () => {
            setLexer("|a| a := [ 7 ]. a value.")
            const node = program()
            const code = compile(node)
            const r = (new Function(code))()
            expect(r.value).toBe(7)
        })

        it("|a| a := [ :x | x + 2 ]. a value: 8.", () => {
            setLexer("|a| a := [ :x | x + 2 ]. a value: 8.")
            const node = program()
            const code = compile(node)
            const r = (new Function(code))()
            expect(r.value).toBe(10)
        })

        it("a := [ :x :y | x + y ]. a value: 8 value: 2.", () => {
            setLexer("|a| a := [ :x :y | x + y ]. a value: 8 value: 2.")
            const node = program()
            const code = compile(node)
            const r = (new Function(code))()
            expect(r.value).toBe(10)
        })

        it("|a| a := [ :x :y :z | x + y * z]. a value: 8 value: 2 value: 4.", () => {
            setLexer("|a| a := [ :x :y :z | x + y * z]. a value: 8 value: 2 value: 4.")
            const node = program()
            const code = compile(node)
            const r = (new Function(code))()
            expect(r.value).toBe(40)
        })

        // valueWithArguments: argumentsArray

        it("closure can read outer scope: a:=7. [:b|a+b] value:3.", () => {
            setLexer("|a| a:=7. [:b|a+b] value:3.")
            const node = program()
            const code = compile(node)
            const r = (new Function(code))()
            expect(r.value).toBe(10)
        })

        it("closure can write outer scope: a:=7. [:b|a:=a+b] value:3.", () => {
            setLexer("|a| a:=7. [:b|a:=a+b] value:3.")
            const node = program()
            const scope = new ST_Scope()
            const code = compile(node)
            const r = (new Function(code))()
            expect(r.value).toBe(10)
            expect(scope.get("a").value).toBe(10)
        })

        // smalltalk doesn't want us to overwrite b
        // a:=7. [:b|b:=a+b] value:3

        it("closure can have local variables: a := 7. c := 42. [:b| |c| c := a+b. c / 2.] value:3.", () => {
            setLexer("a := 7. c := 42. [:b| |c| c := a+b. c / 2.] value:3.")
            const node = program()
            const scope = new ST_Scope()

            const code = compile(node, scope)
            const r = (new Function(code))()

            expect(r.value).toBe(5)
            expect(scope.get("a").value).toBe(7)
            expect(scope.get("c").value).toBe(42)
        })
    })

    describe("Array", () => {
        it("x := Array new: 10. x at: 1 put: 10. x at: 1.", () => {
            setLexer(`
            |x|
            x := Array new: 10. 
            x at: 1 put: 10. 
            x at: 1.
        `)
            const node = program()
            const code = compile(node)
            const r = (new Function(code))()
            expect(r.value).toBe(10)
        })
        it("a := #('quick' 8 'fox')", () => {
            setLexer(`|a| a := #('quick' 8 'fox')`)
            const node = program()
            // node?.printTree()
            const code = compile(node)
            const r = (new Function(code))()
            expect(r).toBeInstanceOf(ST_Array)
            expect(r).toEqual([new ST_String('quick'), new ST_Number(8), new ST_String("fox")])
        })
        // #(11 38 3 -2 10) do: [:each | Transcript show: each printString; cr].
        // #(11 38 3 -2 10) select: [:each | each > 10].
        // #(11 38 3 -2 10) reject: [:each | each > 10].

        // #(11 38 3 -2 10) 
        //  do: [:each | Transcript show: each printString]
        //  separatedBy: [Transcript show: '.'].

        // (Smalltalk classes select: [:eachClass | eachClass name = 'ProfStef']) do: [:eachProfstef | eachProfstef next].
    })

    // u                 unary, no argument
    // + arg             binary, one argument
    // k: arg k: arg...  keyword, one or more arguments
    describe("message pattern", () => {
        it("unary", () => {
            setLexer(`method`)
            const node = message_pattern()
            // node?.printTree()
            expect(node?.type).toBe(Type.SYN_MESSAGE_PATTERN)
            expect(node?.child[0]?.type).toBe(Type.TKN_IDENTIFIER)
            expect(node?.child[0]?.text).toBe("method")
        })
        it("binary", () => {
            setLexer(`+ arg`)
            const node = message_pattern()
            // node?.printTree()
            expect(node?.type).toBe(Type.SYN_MESSAGE_PATTERN)
            expect(node?.child[0]?.type).toBe(Type.TKN_BINARY)
            expect(node?.child[0]?.text).toBe("+")
        })
        it("keyword", () => {
            setLexer(`with: arg`)
            const node = message_pattern()
            // node?.printTree()
            expect(node?.type).toBe(Type.SYN_MESSAGE_PATTERN)
            expect(node?.child[0]?.type).toBe(Type.TKN_KEYWORD)
            expect(node?.child[0]?.text).toBe("with:")
            expect(node?.child[1]?.type).toBe(Type.TKN_IDENTIFIER)
            expect(node?.child[1]?.text).toBe("arg")
        })
        it("keywords", () => {
            setLexer(`with: arg do: stuff`)
            const node = message_pattern()
            // node?.printTree()
            expect(node?.type).toBe(Type.SYN_MESSAGE_PATTERN)
            expect(node?.child[0]?.type).toBe(Type.TKN_KEYWORD)
            expect(node?.child[0]?.text).toBe("with:")
            expect(node?.child[1]?.type).toBe(Type.TKN_IDENTIFIER)
            expect(node?.child[1]?.text).toBe("arg")
            expect(node?.child[2]?.type).toBe(Type.TKN_KEYWORD)
            expect(node?.child[2]?.text).toBe("do:")
            expect(node?.child[3]?.type).toBe(Type.TKN_IDENTIFIER)
            expect(node?.child[3]?.text).toBe("stuff")
        })
    })
})
