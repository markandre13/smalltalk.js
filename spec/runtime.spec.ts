import { describe, expect, it } from "vitest"
import { method_definition, program, setLexer } from "../src/compiler/parser"
import { Scope } from "../src/compiler/scope"
import { ST_String } from "../src/classes/ST_String"
import { SystemDictionary } from "../src/classes/SystemDictionary"
import { Chunker } from "../src/compiler/codefile"
import { compile } from "../src/compiler/compile"
import { ClassCategoryReader } from "../src/classes/kernel/ClassCategoryReader"
import { ST_Object } from "../src/classes/kernel/ST_Object"
import { ST_Number } from "../src/classes/numeric/ST_Number"
import { Type } from "../src/compiler/type"
import { st_method_name } from "../src/compiler/evaluate"

export function makeGlobalScope() {
    const scope = new Scope()

    const dict = new SystemDictionary()
    dict._at_put_("Smalltalk", dict)
    dict._at_put_("Object", ST_Object)
    dict._at_put_("String", ST_String)
    dict._at_put_("Number", ST_Number)

    return scope
}

function evaluate(source: string, scope?: Scope) {
    if (scope === undefined) { scope = makeGlobalScope() }
    const lexer = setLexer(source)
    const node = scope.clazz ? method_definition() : program()
    // node?.printTree()
    const unparsed = lexer.unparsed()
    if (unparsed.trim().length !== 0) {
        console.log(`UNPARSED: ${unparsed}`)
    }
    const code = compile(node!, scope)
    try {
        if (scope.clazz) {
            if (node?.type !== Type.SYN_METHOD_DEFINITION) {
                throw Error('expected method definition')
            }

            // node?.printTree()

            const methodDefinition = node!
            const messagePattern = methodDefinition.child[0]!

            const args: any[] = []
            let identifier = ""
            for (let i = 0; i < messagePattern.child.length; ++i) {
                const child = messagePattern.child[i]
                switch(child?.type) {
                    case Type.TKN_IDENTIFIER:
                        args.push(child.text!)
                        break
                    case Type.SYN_UNARY:
                    case Type.TKN_BINARY:
                        identifier = child.text!
                        break
                    case Type.TKN_KEYWORD:
                        identifier += child.text!
                        break
                    default:
                        throw Error('yikes')
                }
            }
            // console.log(`METHOD DEFINITION`)
            // console.log(`  IDENTIFIER: ${identifier}`)
            // console.log(`  ARGS      : [${args.join(", ")}]`)
            // console.log(`  CODE      : ${code}`)

            args.push(code)

            const method = (new Function(...args) as any)

            // console.log(scope.clazz)
            // TODO: add to prototype
            scope.clazz.prototype[st_method_name(identifier)] = method

            return method
        }
        return (new Function(code))()
    } catch (e) {
        console.error(code)
        // console.log(globalThis.st)
        if (e instanceof TypeError) {
            // console.log(e.stack)
        }
        throw e
    }
}

describe("runtime", () => {
    describe("global variables", () => {
        it("create global variable", () => {
            evaluate(`
                Smalltalk at: #foo put: 'hello'.
            `)
            expect(SystemDictionary.at("foo").value).to.equal("hello")
        })
        it("write global variable", () => {
            const r = evaluate(`
                Smalltalk at: #foo put: 'hello'.
                foo := 'world'.
            `)
            expect(r.value).to.equal("world")
            expect(SystemDictionary.at("foo").value).to.equal("world")
        })
        it("read global variable", () => {
            const r = evaluate(`
                Smalltalk at: #foo put: 'hello'.
                Smalltalk at: #bar put: foo.
                foo.
            `)
            expect(r.value).to.equal("hello")
            expect(SystemDictionary.at("bar").value).to.equal("hello")
        })
        it("return global variable", () => {
            const r = evaluate(`
                Smalltalk at: #foo put: 'hello'.
                ^foo.
            `)
            expect(r.value).to.equal("hello")
            // expect(SystemDictionary.at("bar").value).to.equal("hello")
        })
    })
    describe("create class", () => {
        it("subclass", () => {
            evaluate(`
                Object subclass: #Dot
                    instanceVariableNames: 'x y'
                    classVariableNames: ''
                    poolDictionaries: ''
                    category: 'Yoo-Test'.
                Smalltalk at: #obj put: Dot new.
                Smalltalk at: #name put: obj class name.
            `)
            expect(SystemDictionary.at("name")).to.equal("Dot")
        })
        it("comment", () => {
            const r = evaluate(`
                Object subclass: #Dot
                    instanceVariableNames: 'x y'
                    classVariableNames: ''
                    poolDictionaries: ''
                    category: 'Yoo-Test'.
                Dot comment: 'The dot is actually a point.'.
                Dot comment.
            `)
            expect(r.value).to.equal("The dot is actually a point.")
        })
        it("method", () => {
            const codefile = new Chunker(`
                Object subclass: #Dot
                    instanceVariableNames: 'x y'
                    classVariableNames: ''
                    poolDictionaries: ''
                    category: 'Yoo-Test'.
                !Dot methodsFor: 'yoo-work'!
                init
                     x := 3.
                     y := 5.
                ! !
                Smalltalk at: #dot put: Dot new.
                dot init.
                `)

            const scope = makeGlobalScope()
            let classScope: Scope | undefined
            while (true) {
                const chunk = codefile.chunk()
                if (chunk === null) { break }
                if (chunk.length === 0) {
                    // console.log('end of methods')
                    classScope = undefined
                } else {
                    const r = evaluate(chunk, classScope ? classScope : scope)
                    if (r instanceof ClassCategoryReader) {
                        // console.log('start methods')
                        classScope = new Scope(scope, r.clazz)
                    }
                }
            }
          
            expect(globalThis.st.dot.x.value).to.equal(3)
            expect(globalThis.st.dot.y.value).to.equal(5)
        })
    })
})
