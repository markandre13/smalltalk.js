import { describe, expect, it } from "vitest"
import { program, setLexer } from "../src/parser"
import { compile } from "../src/compile"
import { ST_Scope } from "../src/classes/ST_Scope"
import { ST_String } from "../src/classes/ST_String"
import { SystemDictionary } from "../src/classes/SystemDictionary"

class ST_Object {
    static _subclass_instanceVariableNames_classVariableNames_poolDictionaries_category_(
        subclass: ST_String,
        instanceVariableNames: ST_String,
        classVariableNames: ST_String,
        poolDictionaries: ST_String,
        category: ST_String
    ) {
        // what smalltalk would do here:
        // ST_Object would be an instance of
        console.log(`Object subclass: #${subclass} instanceVariableNames: '${instanceVariableNames}' ...`)

        let clazz = new ST_Class()
        clazz.instanceVariables = instanceVariableNames
        clazz.name = subclass.value

        SystemDictionary.atPut(subclass.value, clazz)
    }
}

class ST_Behaviour {
    superclass: any
    methodDict: any
    format: any
    subclasses: any

    _new() {
        return {
            _class: () => {
                return this
            }
        }
    }
}

class ST_ClassDescription extends ST_Behaviour {
    instanceVariables: any
    organization: any
}

// Every object is an instance of a class. ???
// does it have a reference to it's MetaClass?
class ST_Class extends ST_ClassDescription {
    name?: string
    classPool: any    // stores all class variables
    sharedPools: any

    _name() {
        return this.name
    }
}

// Every class is an instance of a metaclass.
// ST_MetaClass is not subclassed
// When we want to 'Object subclass: #Point'
// we also 
class ST_MetaClass extends ST_ClassDescription {
    thisClass?: ST_Class

    // override new(): ST_Class {
    //     if (this.thisClass !== undefined) {
    //         throw Error("A Metaclass should only have one instance")
    //     }
    //     this.thisClass = super._new()
    //     return this.thisClass
    // }

    // this is the method creating a ST_MetaClass
    // for now: DO NOT IMPLEMENT IT, USE ST_Object's subclass:... instead
    // _name_inEnvironment_subclassOf(
    //     newName: ST_Symbol,
    //     environ: ST_SystemDictionary,
    //     sup: ST_Symbol // this would be where we get the prototype
    // ) {
    // }
}

export function makeGlobalScope() {
    const scope = new ST_Scope()

    const dict = new SystemDictionary()
    dict._at_put_("Smalltalk", dict)
    dict._at_put_("Object", ST_Object)
    dict._at_put_("String", ST_String)

    return scope
}

function evaluate(source: string) {
    const scope = makeGlobalScope()
    setLexer(source)
    const node = program()
    const code = compile(node!, scope)
    // console.log(code)
    try {
        new Function(code)()
    } catch (e) {
        console.error(code)
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
        it("read global variable", () => {
            evaluate(`
                Smalltalk at: #foo put: 'hello'.
                Smalltalk at: #bar put: foo.
            `)
            expect(SystemDictionary.at("bar").value).to.equal("hello")
        })
    })
    describe("create class", () => {
        it("subclass", () => {
            evaluate(`
                | d |
                Object subclass: #Dot
                    instanceVariableNames: 'x y'
                    classVariableNames: ''
                    poolDictionaries: ''
                    category: 'Yoo-Test'.
                d := Dot new.
                Smalltalk at: #bar put: d.
                Smalltalk at: #foo put: d class name.
            `)
            // console.log((window as any).st)
            expect(SystemDictionary.at("foo")).to.equal("Dot")

            console.log(SystemDictionary.at("bar"))
        })
        // NEXT STEP: add method
    })
})
