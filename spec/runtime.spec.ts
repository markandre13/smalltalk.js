import { describe, expect, it } from "vitest"
import { program, setLexer } from "../src/compiler/parser"
import { Scope } from "../src/compiler/scope"
import { ST_String } from "../src/classes/ST_String"
import { SystemDictionary } from "../src/classes/SystemDictionary"
import { Chunker } from "../src/compiler/codefile"
import { compile } from "../src/compiler/compile"

class ST_Object {
    static _subclass_instanceVariableNames_classVariableNames_poolDictionaries_category_(
        subclass: ST_String,
        instanceVariableNames: ST_String,
        classVariableNames: ST_String,
        poolDictionaries: ST_String,
        category: ST_String
    ) {
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

class ST_ClassOrganizer {
    globalComment: ST_String | null = null
    categoryArray: any
    categoryStops: any
    elementArray: any

    /**
     * Answer the comment associated with the object that refers to the receiver.
     */
    _classComment() {
        if (this.globalComment === undefined) {
            return new ST_String("")
        }
        return this.globalComment
    }
    _classComment_(aString: ST_String) {
        if (aString.value.length === 0) {
            this.globalComment = null
        } else {
            this.globalComment = aString
        }
    }
}

class ST_ClassDescription extends ST_Behaviour {
    instanceVariables: any
    organization?: ST_ClassOrganizer

    /**
     * Set the receiver's comment to be the argument, aString.
     */
    _comment_(aString: ST_String) {
        this._organization()._classComment_(aString)
    }
    /**
     * Answer the receiver's comment.
     */
    _comment() {
        return this._organization()._classComment()
    }
    /**
     * Answer the instance of ClassOrganizer that represents the organization
     * of the messages of the receiver.
     */
    _organization() {
        if (this.organization === undefined) {
            this.organization = new ST_ClassOrganizer()
        }
        return this.organization
    }
}

class ClassCategoryReader {
    clazz: ST_Class
    category: ST_String
    constructor(clazz: ST_Class, category: ST_String) {
        this.clazz = clazz
        this.category = category
    }
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
    /**
     * Answer a ClassCategoryReader for accessing the messages in the method
	 * dictionary category, aString, of the receiver.
     */
    _methodsFor_(aString: ST_String) {
        console.log(`Class methodsFor: ${aString}`)
        // ^ClassCategoryReader class: self category: aString asSymbol
        return new ClassCategoryReader(this, aString)
    }
}

// Every class is an instance of a metaclass.
// ST_MetaClass is not subclassed
// When we want to 'Object subclass: #Point'
// we also 
class ST_MetaClass extends ST_ClassDescription {
    thisClass?: ST_Class
}

export function makeGlobalScope() {
    const scope = new Scope()

    const dict = new SystemDictionary()
    dict._at_put_("Smalltalk", dict)
    dict._at_put_("Object", ST_Object)
    dict._at_put_("String", ST_String)

    return scope
}

function evaluate(source: string, scope?: Scope) {
    if (scope === undefined) { scope = makeGlobalScope() }
    const lexer = setLexer(source)
    const node = program()
    // node?.printTree()
    const unparsed = lexer.unparsed()
    if (unparsed.length !== 0) {
        console.log(`UNPARSED: ${unparsed}`)
    }
    const code = compile(node!, scope)
    // console.log(code)
    try {
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
        it.only("method", () => {
            const codefile = new Chunker(`
                Object subclass: #Dot
                    instanceVariableNames: 'x y'
                    classVariableNames: ''
                    poolDictionaries: ''
                    category: 'Yoo-Test'.
                !Dot methodsFor: 'yoo-work'!
            `)

            //   !Dot methodsFor: 'yoo-work'!
            //     init
            //         x := 0.
            //     ! !
            const scope = makeGlobalScope()
            let classScope: Scope | undefined
            while (true) {
                const chunk = codefile.chunk()
                if (chunk === null) { break }
                if (chunk.length === 0) {
                    console.log('end of methods')
                    classScope = undefined
                } else {
                    const r = evaluate(chunk, classScope ? classScope : scope)
                    if (r instanceof ClassCategoryReader) {
                        console.log('start methods')
                        classScope = new Scope(scope, r.clazz)
                    }
                }
                // console.log('-------------')
                // console.log(chunk)
            }

            // globalThis.st.Dot._methodsFor_(new ST_String("yoo-work"))
        })
    })
})
