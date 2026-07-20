import { describe, expect, it } from "vitest"
import { method_definition, program, setLexer } from "../src/compiler/parser"
import { Scope } from "../src/compiler/scope"
import { ST_String } from "../src/classes/collections/ST_String"
import { SystemDictionary } from "../src/classes/system/SystemDictionary"
import { Chunker } from "../src/compiler/codefile"
import { compile } from "../src/compiler/compile"
import { ClassCategoryReader } from "../src/classes/kernel/ClassCategoryReader"
import { ST_Object } from "../src/classes/kernel/ST_Object"
import { ST_Number } from "../src/classes/numeric/ST_Number"
import { Type } from "../src/compiler/type"
import { st_method_name } from "../src/compiler/evaluate"
import { ST_MetaClass } from "../src/classes/kernel/ST_MetaClass"

export function makeGlobalScope() {
    const scope = new Scope()

    const dict = new SystemDictionary()
    dict._at_put_("Smalltalk", dict)
    dict._at_put_("Object", ST_Object)
    dict._at_put_("String", ST_String)
    dict._at_put_("Number", ST_Number)

    return scope
}

function addMethod(source: string, scope: Scope) {
    console.log(`---------------------------- addMethod ----------------------------`)
    console.log(source)
    console.log(`-------------------------------------------------------------------`)

    if (scope.clazz === undefined) {
        throw Error(`addMethod's scope needs to contains a class`)
    }
    const lexer = setLexer(source)
    const node = scope.clazz ? method_definition() : program()
    // node?.printTree()
    const unparsed = lexer.unparsed()
    if (unparsed.trim().length !== 0) {
        console.log(`UNPARSED: ${unparsed}`)
    }

    // node?.printTree()
    // console.log(lexer.lex())

    const methodDefinition = node!
    const messagePattern = methodDefinition.child[0]!

    const args: any[] = []
    let identifier = ""
    for (let i = 0; i < messagePattern.child.length; ++i) {
        const child = messagePattern.child[i]
        switch (child?.type) {
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
                throw Error(`${scope.clazz.name} ${identifier}: unexpected type in message pattern`)
        }
    }
    console.log(`METHOD DEFINITION`)
    console.log(`  IDENTIFIER: ${identifier}`)
    console.log(`  ARGS      : [${args.join(", ")}]`)

    let code = compile(node!, scope)
    if (node?.type !== Type.SYN_METHOD_DEFINITION) {
        throw Error('expected method definition')
    }

    console.log(`  CODE      : ${code}`)

    args.push(code)

    let method: Function
    try {
        method = new Function(...args)
    } catch (e) {
        console.log(code)
        console.log(e)
        console.log(e.stack)
        throw e
    }
    Object.defineProperty(method, "name", { value: `${scope.clazz.name} ${identifier}` })

    // console.log(scope.clazz)
    // TODO: add to prototype
    // console.log
    // console.log(scope.clazz.constructor.name)
    if (scope.clazz instanceof ST_MetaClass) {
        console.log(code)
        scope.clazz.thisClass[st_method_name(identifier)] = method
    } else {
        scope.clazz.prototype[st_method_name(identifier)] = method
    }

    // console.log("OK")

    return method
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
        return (new Function(code))()
    } catch (e) {
        console.log('----------------------------------------------------------')
        console.log(source)
        console.log('----------------------------------------------------------')
        console.error(code)
        console.log('----------------------------------------------------------')
        // console.log(globalThis.st)
        if (e instanceof TypeError) {
            // console.log(e.stack)
        }
        throw e
    }
}

function evaluateSource(code: string, scope?: Scope) {
    if (scope === undefined) { scope = makeGlobalScope() }
    const codefile = new Chunker(code)
    let classScope: Scope | undefined
    while (true) {
        const chunk = codefile.chunk()
        if (chunk === null) { break }
        if (chunk.length === 0) {
            // console.log('end of methods')
            classScope = undefined
            continue
        }
        if (classScope) {
            addMethod(chunk, classScope)
        } else {
            const r = evaluate(chunk, classScope ? classScope : scope)
            if (r instanceof ClassCategoryReader) {
                // console.log('start methods')
                classScope = new Scope(scope, r.clazz)
            }
        }
    }
}

async function evaluateFile(file: string, scope?: Scope) {
    const r = await fetch(file)
    if (!r.ok) {
        throw Error(`failed to load file "${file}"`)
    }
    evaluateSource(await r.text(), scope)
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
            evaluateSource(`
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

            const st = (globalThis as any).st
            expect(st.dot.x.value).to.equal(3)
            expect(st.dot.y.value).to.equal(5)
        })
        describe.only("Point", () => {
            it("x:,y:", async () => {
                const scope = makeGlobalScope()
                await evaluateFile("src/classes/graphics/Point.st", scope)
                evaluateSource(`
                    |p0|
                    "p0 := Point x: 3 y: 5."
                    p0 := Point new setX: 3 setY: 5.
                    Smalltalk at: #p0 put: p0.
                `, scope)
                const st = (globalThis as any).st
                // this seems to return 5 instead of Point 3 @ 5
                // when there's no return statement, the self is returned? (unless it's a closure?)
                // ^self new setX: xInteger setY: yInteger! !
                console.log(st.p0)
                // expect(st.p0.x.value).to.equal(3)
                // expect(st.p0.y.value).to.equal(5)
            })
        })
        describe("SUnit", () => {
            it("load", async () => {
                const scope = makeGlobalScope()
                await evaluateFile("src/classes/sunit/SUnit.st", scope)
            })
        })
        it("experimental Smalltalk Kernel Classes", () => {
            // nil subclass: #Object                ; create new class
            const MetaClass = {
                methodDict: {
                    _name: function () {
                        return this.thisClass ? `${this.thisClass._name()} class` : "a Metaclass"
                    }
                } as any
            }

            // const Behaviour = {
            //     __proto__: {
            //         hello: function() { console.log("hello") }
            //     }
            // }
            // ClassDescription
            const ObjectClass = {
                __proto__: MetaClass.methodDict,
                methodDict: {
                    _class: function () { return this.$class },
                    _name: function () { return "Object" },
                    _new: function () {
                        return {
                            __proto__: this.methodDict,
                            _class: () => {
                                return this
                            }
                        }
                    }
                } as any
            }
            const Object = {
                $class: ObjectClass, // not sure where Smalltalk stores this value
                __proto__: ObjectClass.methodDict,
                methodDict: {} as any,
            }
            ObjectClass.thisClass = Object

            // Object methodsFor: 'cat1'            ; add method
            // ...
            Object.methodDict["meth1"] = () => "called meth1"

            // o := Object new.                     ; create instance
            const o = Object._new()
            // o meth1.                             ; call method
            expect(o.meth1()).to.equal("called meth1")

            expect(Object._name()).to.equal("Object")
            expect(Object._class()).to.equal(ObjectClass)
            expect(ObjectClass._name()).to.equal("Object class")

            // Object class methodsFor: 'cat 2'
            // ...
            Object._class().methodDict["meth2"] = () => "called meth2"

            // Object meth2.

            expect(Object.meth2()).to.equal("called meth2")

            // Behaviour.hello()

            function Behavior() {

            }
            // const b = new Behavior()

            function myFunc(someArg: number) {
                return someArg > 3
            }
            myFunc.description = "default description"
        })
    })
})
