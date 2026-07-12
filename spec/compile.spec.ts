import { expect, it, describe } from "vitest"
import { expression, method_definition, program, setLexer } from "../src/parser"
import { compile } from "../src/compile"
import { ST_Transcript } from "../src/classes/ST_Transcript"
import { initialize } from "../src/initialize"

// while smalltalk has no type checks, it requires to declare variable names.
// hence we could track names, rewrite them and throw errors
// 
// we could use global.st = {} to separate the smalltalk stuff from the rest.
// do do this properly, how does Smalltalk do this?
// i read something about a global Smalltalk dictionary?
// SystemDictionary

// https://www.gnu.org/software/smalltalk/manual-base/html_node/SystemDictionary.html
// Defined in namespace Smalltalk
// Superclass: RootNamespace
// Category: Language-Implementation
// I am a special namespace. I only have one instance, called "Smalltalk", which is known to the Smalltalk interpreter. I define several methods that are "system" related, such as #quitPrimitive. My instance also helps keep track of dependencies between objects.

// symbol == #Smalltalk ifTrue: [^'"is a global.  Smalltalk is the only instance of SystemDictionary and holds all global variables."'].

// Dictionary variableSubclass: #SystemDictionary
//   'I am a special dictionary that supports protocol for asking questions about the structure of the system.  My only instance is Smalltalk.'
// yep, that seems to be the place were we put global classes and variables

initialize()

describe("compile", () => {
    describe("printNl", () => {
        it("'hello' printNl", () => {
            setLexer("'hello' printNl")
            const node = program()
            const code = compile(node!)
            expect(code).toEqual("return (new ST_String('hello')).printNl();")

            ST_Transcript.buffer = ""
            const result = new Function(code)()
            expect(ST_Transcript.buffer).toBe("hello\n")
        })

        it("42 printNl", () => {
            setLexer("42 printNl")
            const node = program()
            const code = compile(node!)
            // console.log(code)
            expect(code).toEqual("return (new ST_Number(42)).printNl();")

            ST_Transcript.buffer = ""
            const result = new Function(code)()
            expect(ST_Transcript.buffer).toBe("42\n")
        })
    })

    describe("construct native types", () => {
        it("integer", () => {
            setLexer("1")
            const node = expression()
            const r = compile(node!)
            // console.log(r)
            expect(r).toBe("new ST_Number(1)")
        })
        it.skip("float", () => {
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
            const node = program()
            const code = compile(node!)
            expect(code).toEqual("return (new ST_Number(1))._add(new ST_Number(3));")

            const result = new Function(code)()
            expect(result.value).toBe(4)
        })

        it("2 sin", () => {
            setLexer("2 sin")
            const node = program()
            const code = compile(node!)
            expect(code).toEqual("return (new ST_Number(2)).sin();")

            const result = new Function(code)()
            expect(result.value).toBe(0.9092974268256817)
        })

        it("2 * 3", () => {
            setLexer("2 * 3")
            const node = program()
            const code = compile(node!)
            expect(code).toEqual("return (new ST_Number(2))._mul(new ST_Number(3));")

            const result = new Function(code)()
            expect(result.value).toBe(6)
        })

        it("10 - 3", () => {
            setLexer("10 - 3")
            const node = program()
            const code = compile(node!)
            expect(code).toEqual("return (new ST_Number(10))._sub(new ST_Number(3));")

            const result = new Function(code)()
            expect(result.value).toBe(7)
        })

        it("8 / 2", () => {
            setLexer("8 / 2")
            const node = program()
            const code = compile(node!)
            expect(code).toEqual("return (new ST_Number(8))._div(new ST_Number(2));")

            const result = new Function(code)()
            expect(result.value).toBe(4)
        })

        it("8 / 2 + 6", () => {
            setLexer("8 / 2 + 6")
            const node = program()
            const code = compile(node!)
            expect(code).toEqual("return ((new ST_Number(8))._div(new ST_Number(2)))._add(new ST_Number(6));")

            const result = new Function(code)()
            expect(result.value).toBe(10)
        })
    })
    describe("cascaded messages", () => {

        it("2 + 3 ; - 1", () => {
            setLexer("2 + 3 ; - 1")
            const node = program()

            const code = compile(node!)
            expect(code).toEqual("return cascade_messages(new ST_Number(2),($_)=>($_)._add(new ST_Number(3)),($_)=>($_)._sub(new ST_Number(1)));")

            const result = new Function(code)()
            expect(result.value).toBe(1)
        })

        // 2 + 3     * 4 ;            - 1
        // ( 2 + 3 ) * 4 ; ( 2 + 3 ) ; -1
        // 20            ; 4
        it("2 + 3 * 4 ; - 1", () => {
            setLexer("2 + 3 * 4 ; - 1")
            const node = program()

            const code = compile(node!)
            expect(code).toEqual("return cascade_messages((new ST_Number(2))._add(new ST_Number(3)),($_)=>($_)._mul(new ST_Number(4)),($_)=>($_)._sub(new ST_Number(1)));")

            const result = new Function(code)()
            expect(result.value).toBe(4)
        })

        it("2 + 3 * 4 * 2 ; + 1", () => {
            setLexer("2 + 3 * 4 * 2 ; + 1")
            const node = program()

            const code = compile(node!)
            expect(code).toEqual("return cascade_messages(((new ST_Number(2))._add(new ST_Number(3)))._mul(new ST_Number(4)),($_)=>($_)._mul(new ST_Number(2)),($_)=>($_)._add(new ST_Number(1)));")

            const result = new Function(code)()
            expect(result.value).toBe(21)
        })

        it("1 + 3 * 4 ; + 5 ; + 6", () => {
            setLexer("1 + 3 * 4 ; + 5 ; + 6")
            const node = program()

            const code = compile(node!)
            expect(code).toEqual("return cascade_messages((new ST_Number(1))._add(new ST_Number(3)),($_)=>($_)._mul(new ST_Number(4)),($_)=>($_)._add(new ST_Number(5)),($_)=>($_)._add(new ST_Number(6)));")

            const result = new Function(code)()
            expect(result.value).toBe(10)
        })

        // ANSI Smalltalk allows multiple messages after ';' but I haven't found
        // an implementation actually resolving this without an error message.
        // but 1 + 3 + 7 + 8 = 19 looks reasonable
        it("1 + 3 * 4 ; + 5 + 6 ; + 7 + 8", () => {
            setLexer("1 + 3 * 4 ; + 5 + 6 ; + 7 + 8")
            const node = program()

            const code = compile(node!)
            expect(code).toEqual("return cascade_messages((new ST_Number(1))._add(new ST_Number(3)),($_)=>($_)._mul(new ST_Number(4)),($_)=>(($_)._add(new ST_Number(5)))._add(new ST_Number(6)),($_)=>(($_)._add(new ST_Number(7)))._add(new ST_Number(8)));")

            const result = new Function(code)()
            expect(result.value).toBe(19)
        })
    })
    describe("parenthesis", () => {
        it("( 1 + 2 ) * 3", () => {
            setLexer("( 1 + 2 ) * 3")
            const node = program()
            const code = compile(node!)
            expect(code).toEqual("return ((new ST_Number(1))._add(new ST_Number(2)))._mul(new ST_Number(3));")

            const result = new Function(code)()
            expect(result.value).toBe(9)
        })

        it("1 * ( 2  + 3 )", () => {
            setLexer("1 * ( 2  + 3 )")
            const node = program()
            const code = compile(node!)
            expect(code).toEqual("return (new ST_Number(1))._mul((new ST_Number(2))._add(new ST_Number(3)));")

            const result = new Function(code)()
            expect(result.value).toBe(5)
        })
    })
    describe("variables", () => {
        it("| a | a := 42", () => {
            setLexer("|a| a := 42. Transcript show: a.")
            const node = program()
            const code = compile(node!)
            expect(code).toEqual("let a;a=new ST_Number(42);return (ST_Transcript).show_(a);")
            ST_Transcript.buffer = ""
            new Function(code)()
            expect(ST_Transcript.buffer).toBe('42')
        })
        it("|a b| a := 1. b := 2.", () => {
            setLexer("|a b| a := 1. b := 2. Transcript show: a; cr; show: b; cr.")
            const node = program()
            const code = compile(node!)
            expect(code).toEqual("let a,b;a=new ST_Number(1);b=new ST_Number(2);return cascade_messages(ST_Transcript,($_)=>($_).show_(a),($_)=>($_).cr(),($_)=>($_).show_(b),($_)=>($_).cr());")
            ST_Transcript.buffer = ""
            new Function(code)()
            expect(ST_Transcript.buffer).toBe('1\n2\n')
        })
        it("read variable: a := 7. a + 3.", () => {
            setLexer("|a| a := 7. a + 3.")
            const node = program()
            const code = compile(node!)
            // console.log(code)
            expect(code).toEqual("let a;a=new ST_Number(7);return (a)._add(new ST_Number(3));")
            ST_Transcript.buffer = ""
            const r = new Function(code)()
            expect(r.value).toBe(10)
        })
    })

    describe("statements", () => {
        it("the result of the last statement is returned: 1. 2.", () => {
            setLexer("1. 2.")
            const node = program()
            // node?.printTree()
            const code = compile(node!)
            expect(code).toEqual("new ST_Number(1);return new ST_Number(2);")
            // console.log(code)

            const result = new Function(code)()
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

    describe("code block", () => {
        it("[ :a | ]", () => {
            setLexer("[ :a | ]")
            const node = program()
            const code = compile(node)
            expect(code).toBe("return (a)=>{};") // SURE?
        })

        it("[ :a :b | ]", () => {
            setLexer("[ :a :b | ]")
            const node = program()
            const code = compile(node)
            expect(code).toBe("return (a,b)=>{};") // SURE?
        })

        // no temp, 0 stmt
        it("[ ]", () => {
            setLexer("[ ]")
            const node = program()
            const code = compile(node)
            expect(code).toBe("return ()=>{};") // SURE?
        })

        // no temp, 1 stmt
        it("[ 7 ]", () => {
            setLexer("[ 7 ]")
            const node = program()
            const code = compile(node)
            expect(code).toBe("return ()=>new ST_Number(7);") // missing return
        })

        // no temp, 2 stmt
        it("[ 7. 3. ]", () => {
            setLexer("[ 7. 3. ]")
            const node = program()
            const code = compile(node)
            expect(code).toBe("return ()=>{new ST_Number(7);return new ST_Number(3)};")
        })

        // 0 temp, 0 stmt
        it("[||]", () => {
            setLexer("[||]")
            const node = program()
            const code = compile(node)
            expect(code).toBe("return ()=>{};")
        })

        // 0 temp, 1 stmt
        it("[|| 1 ]", () => {
            setLexer("[|| 1]")
            const node = program()
            const code = compile(node)
            expect(code).toBe("return ()=>new ST_Number(1);")
        })

        // 0 temp, 2 stmt
        it("[|| 1. 2.]", () => {
            setLexer("[|| 1. 2.]")
            const node = program()
            const code = compile(node)
            expect(code).toBe("return ()=>{new ST_Number(1);return new ST_Number(2)};")
        })

        // 1 temp, 0 stmt
        it("[|x|]", () => {
            setLexer("[|x|]")
            const node = program()
            const code = compile(node)
            expect(code).toBe("return ()=>{let x;};")
        })

        // 1 temp, 1 stmt
        it("[|x| x]", () => {
            setLexer("[|x| x:=1]")
            const node = program()
            const code = compile(node)
            expect(code).toBe("return ()=>{let x;return x=new ST_Number(1)};")
        })

        // 1 temp, 2 stmt
        it("[|x| x:=2. x * 3]", () => {
            setLexer("|a| a:=[|x| x:=2. x * 3]. a value")
            const node = program()
            const code = compile(node)
            expect(code).toBe("let a;a=()=>{let x;x=new ST_Number(2);return (x)._mul(new ST_Number(3))};return (a).value();")
            const exec = Function(code)
            expect(exec().value).toBe(6)
        })

        // 2 temp, 0 stmt
        it("[|x y|]", () => {
            setLexer("[|x y|]")
            const node = program()
            const code = compile(node)
            expect(code).toBe("return ()=>{let x,y;};")
        })

        // 2 temp, 1 stmt
        it("[|x y| x:=1]", () => {
            setLexer("[|x y| x:=1]")
            const node = program()
            const code = compile(node)
            expect(code).toBe("return ()=>{let x,y;return x=new ST_Number(1)};")
        })

        // 2 temp, 2 stmt
        it("[|x y| x:=1. y:=2.]", () => {
            setLexer("[|x y| x:=1. y:=2.]")
            const node = program()
            const code = compile(node)
            expect(code).toBe("return ()=>{let x,y;x=new ST_Number(1);return y=new ST_Number(2)};")
        })

        // no arg
        it("[ 7 ] value.", () => {
            setLexer("[ 7 ] value.")
            const node = program()
            const code = compile(node)
            const exec = new Function(code)
            expect(exec().value).toBe(7)
        })

        // 1 arg
        it("[ :x | x + 7 ] value: 3", () => {
            setLexer("[ :x | x + 7 ] value: 3.")
            const node = program()
            const code = compile(node)
            expect(code).toBe("return ((x)=>(x)._add(new ST_Number(7))).value_(new ST_Number(3));")
            const exec = new Function(code)
            // console.log(exec())
            expect(exec().value).toBe(10)
        })

        // 2 arg
        it("[ :x :y | x + y ] value: 8 value: 2.", () => {
            setLexer("[ :x :y | x + y ] value: 8 value: 2.")
            const node = program()
            const code = compile(node)
            const exec = new Function(code)
            expect(exec().value).toBe(10)
        })

        // 3 arg
        it("[ :x :y :z | x + y * z] value: 8 value: 2 value: 4.", () => {
            setLexer("[ :x :y :z | x + y * z] value: 8 value: 2 value: 4.")
            const node = program()
            const code = compile(node)
            const exec = new Function(code)
            expect(exec().value).toBe(40)
        })

        it("closure can read outer scope: |a| a:=7. [:b|a+b] value:3.", () => {
            setLexer("|a| a:=7. [:b|a+b] value:3.")
            const node = program()
            const code = compile(node)
            const exec = Function(code)
            expect(exec().value).toBe(10)
        })

        it("closure can write outer scope: |a| a:=7. [:b|a:=a+b] value:3. a.", () => {
            setLexer("|a| a:=7. [:b|a:=a+b] value:3. a.")
            const node = program()
            const code = compile(node)
            const exec = new Function(code)
            expect(exec().value).toBe(10)
        })

        // smalltalk doesn't want us to overwrite b
        // a:=7. [:b|b:=a+b] value:3

        it("closure can have local variables: a := 7. c := 42. [:b| |c| c := a+b. c / 2.] value:3.", () => {
            setLexer(`
                    | a c |
                    a := 7. c := 42.
                    [ :b | |c| c := a + b. c / 2. ] value: 3.
                    a printNl.
                    c printNl.
                `)
            const node = program()
            const code = compile(node)
            const exec = new Function(code)
            ST_Transcript.buffer = ""
            exec()
            expect(ST_Transcript.buffer).toBe("7\n42\n")
        })
    })

    describe("loop", () => {
        it("1 to: 20 do: [:x | x printNl ]", () => {
            setLexer("1 to: 3 do: [:x | x printNl ]")
            const node = expression()
            ST_Transcript.buffer = ""
            const code = compile(node!)
            const exec = new Function(code)
            exec()
            expect(ST_Transcript.buffer).toBe("1\n2\n3\n")
        })
        it("5 to: 15 by: 5 do: [:x | x printNl ]", () => {
            setLexer("5 to: 15 by: 5 do: [:x | x printNl ]")
            const node = expression()
            ST_Transcript.buffer = ""
            const code = compile(node!)
            const exec = new Function(code)
            exec()
            expect(ST_Transcript.buffer).toBe("5\n10\n15\n")
        })
        it("15 to: 5 by: -5 do: [:x | x printNl ]", () => {
            setLexer("15 to: 5 by: -5 do: [:x | x printNl ]")
            const node = expression()
            ST_Transcript.buffer = ""
            const code = compile(node!)
            const exec = new Function(code)
            exec()
            expect(ST_Transcript.buffer).toBe("15\n10\n5\n")
        })
    })

    describe("Array", () => {
        it("|x| x := Array new: 10. x at: 1 put: 8. x at: 8.", () => {
            setLexer(`
                |x|
                x := Array new: 10. 
                x at: 1 put: 8. 
                x at: 1.
            `)
            const node = program()
            const code = compile(node!)
            const exec = new Function(code)
            expect(exec().value).toBe(8)
        })
        it("a := #('quick' 8 'fox')", () => {
            setLexer(`
                |a|
                a := #('quick' 8 'fox').
                a do: [:it | it printNl].
            `)
            const node = program()
            const code = compile(node)
            ST_Transcript.buffer = ""
            const exec = Function(code)
            exec()
            expect(ST_Transcript.buffer).toBe("quick\n8\nfox\n")
        })
        // #(11 38 3 -2 10) do: [:each | Transcript show: each printString; cr].
        // #(11 38 3 -2 10) select: [:each | each > 10].
        // #(11 38 3 -2 10) reject: [:each | each > 10].

        // #(11 38 3 -2 10) 
        //  do: [:each | Transcript show: each printString]
        //  separatedBy: [Transcript show: '.'].

        // (Smalltalk classes select: [:eachClass | eachClass name = 'ProfStef']) do: [:eachProfstef | eachProfstef next].
    })

    describe("method definition", () => {
        it.only("return", () => {
            setLexer(`|x y deltaPoint | x + deltaPoint x @ (y + deltaPoint y)`)
            const node = program()
            node?.printTree()
            const code = compile(node)
            console.log(code)
        })
        it("Point +", () => {
            const lexer = setLexer(`+ delta 
	"Answer a new Point that is the sum of the receiver and delta (which is a Point 
	or Number)."

	| deltaPoint |
	deltaPoint ← delta asPoint.
	↑x + deltaPoint x @ (y + deltaPoint y)`)
            const node = method_definition()
            if (!lexer.eof()) {
                console.log(`UNPARSED: ${lexer.unparsed()}`)
            }
            // node?.printTree()
            // const code = compile(node)
            // console.log(code)
        })
    })
})
