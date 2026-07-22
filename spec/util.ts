import { ST_String } from "../src/classes/collections/ST_String"
import { ClassCategoryReader } from "../src/classes/kernel/ClassCategoryReader"
import { ST_MetaClass } from "../src/classes/kernel/ST_MetaClass"
import { ST_Object } from "../src/classes/kernel/ST_Object"
import { ST_Number } from "../src/classes/numeric/ST_Number"
import { SystemDictionary } from "../src/classes/system/SystemDictionary"
import { BlockReturn } from "../src/compiler/blockreturn"
import { Chunker } from "../src/compiler/codefile"
import { compile } from "../src/compiler/compile"
import { st_method_name } from "../src/compiler/evaluate"
import { method_definition, program, setLexer } from "../src/compiler/parser"
import { Scope, ScopeType } from "../src/compiler/scope"
import { Type } from "../src/compiler/type"

export function makeGlobalScope() {
    const scope = new Scope()

    const dict = new SystemDictionary()
    dict._at_put_("_rt", BlockReturn)
    dict._at_put_("Smalltalk", dict)
    dict._at_put_("Object", ST_Object)
    dict._at_put_("String", ST_String)
    dict._at_put_("Number", ST_Number)

    return scope
}

export function addMethod(source: string, scope: Scope) {
    // console.log(`---------------------------- addMethod ----------------------------`)
    // console.log(source)
    // console.log(`-------------------------------------------------------------------`)

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
    // console.log(`METHOD DEFINITION`)
    // console.log(`  IDENTIFIER: ${identifier}`)
    // console.log(`  ARGS      : [${args.join(", ")}]`)

    let code = compile(node!, scope)
    if (node?.type !== Type.SYN_METHOD_DEFINITION) {
        throw Error('expected method definition')
    }

    // console.log(`  CODE      : ${code}`)

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
        scope.clazz.thisClass[st_method_name(identifier)] = method
    } else {
        scope.clazz.prototype[st_method_name(identifier)] = method
    }

    // console.log("OK")

    return method
}

export function evaluate(source: string, scope?: Scope) {
    if (scope === undefined) { scope = makeGlobalScope() }
    const lexer = setLexer(source)
    const node = scope.clazz ? method_definition() : program()
    const unparsed = lexer.unparsed()
    let code = ""
    try {
        if (unparsed.trim().length !== 0) {
            throw Error(`UNPARSED: ${unparsed}`)
        }
        code = compile(node!, scope)
        return (new Function(code))()
    } catch (e) {
        console.log(`ERROR: ${e}`)
        console.log(`SCOPE: ${ScopeType[scope.type]}`)
        console.log('---------------------------- source -------------------------------')
        console.log(source)
        console.log('----------------------------- node --------------------------------')
        node?.printTree()
        console.log('----------------------------- code --------------------------------')
        console.error(code)
        console.log('-------------------------------------------------------------------')
        throw e
    }
}

export function evaluateSource(code: string, scope?: Scope) {
    if (scope === undefined) { scope = makeGlobalScope() }
    const codefile = new Chunker(code)
    let classScope: Scope | undefined
    while (true) {
        const chunk = codefile.chunk()
        // console.log(`------------------- in class ${classScope !== undefined}\n${chunk}\n-------------------`)
        if (chunk === null) { break }
        if (chunk.length === 0) {
            // console.log('end of methods')
            classScope = undefined
            continue
        }
        if (classScope) {
            addMethod(chunk, classScope)
        } else {
            ST_MetaClass.reader = undefined
            evaluate(chunk, classScope ? classScope : scope)
            if (ST_MetaClass.reader) {
                // console.log('START METHODS #############################################')
                ST_MetaClass.reader
                classScope = new Scope(scope, ST_MetaClass.reader.clazz)
            }
        }
    }
    if (classScope) {
        return classScope
    }
    return scope
}

export async function evaluateFile(file: string, scope?: Scope) {
    const r = await fetch(file)
    if (!r.ok) {
        throw Error(`failed to load file "${file}"`)
    }
    evaluateSource(await r.text(), scope)
}