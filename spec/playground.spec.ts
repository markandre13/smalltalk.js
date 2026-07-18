import { it, describe, expect } from "vitest"
import { program, setLexer } from "../src/compiler/parser"
import { compile } from "../src/compile"
import { initialize } from "../src/initialize"

describe("playground", () => {
    it.skip("load program", () => {
        initialize()
        // codefile.ts reads the source as chunks which can be compiled individually
        // they contain method sections
        // but there's also the way to create methods / classes in the browser

        const a = `
            nil subclass: #Object
                instanceVariableNames: ''
                classVariableNames: 'DependentsFields ErrorRecursion '
                poolDictionaries: ''
                category: 'Kernel-Objects'`


        // Object comment: 'Object is the superclass of all classes.  It thus provides default behavior common to all objects, such as class access, copying and printing.'

        const b = `
            Object subclass: #Point
                instanceVariableNames: 'x y '
                classVariableNames: ''
                poolDictionaries: ''
                category: 'Graphics-Primitives'`

        setLexer(a)
        const node = program()!
        // node.printTree()
        const code = compile(node)
        console.log(code)
        Function(code)()
    })

    // Point comment: 'I am an x-y pair of numbers usually designating a location on the screen'

})
