import { describe, expect, it } from "vitest"
import { SystemDictionary } from "../src/classes/system/SystemDictionary"
import { evaluate, evaluateFile, evaluateSource, makeGlobalScope } from "./util"

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
