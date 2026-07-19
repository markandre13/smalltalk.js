//
// runtime support
//

import { Scope } from "./scope"
import { initialize } from "./initialize"

// OKAY. i have collected enough information without grasping it yet
// i should now just begin to implement stuff and compare the behaviour
// with that of GNU SmallTalk.

// so compile(), when encountering an identifier, looks it up
// within the scope.
// * have nothing for the global scope or go directly to ST_SystemDictionary?
// * classes are instances of ST_MetaClass
// * for the temporary variables while compiling methods, i will still need
//   to have something like ST_Scope
// => start by using ST_Scope as a wrapper for global and class?

// i might have missed the distinction of instance and class methods...?
// * instance methods are in Class
// * class methods are in MetaClass

// OKAY. THE THING THAT CONFUSES ME:
// WHY DON'T WE HAVE
//   CLASS
//     new instance
//     new subclass
//
// Object
//   Behaviour
//     ClassDescription
//     Class
//        ProtoObject (MetaClass)
//          Object (MetaClass)
//            Boolean (MetaClass)

// The metaclass hierarchy parallels the class hierarchy

// where are the class variables??? in the classPool
// class ST_Object {
//     /**
//      * Answer the object which is the receiver's class.
//      */
//     _class(): ST_Class { throw Error("TBD") }
// }

// class ST_Symbol {

// }

// class ST_SystemDictionary {
//     _at() { }
// }


// finding a method:
//   2 printNl    -> Integer.printNl -> Object.printNl
//   Integer.x -> Integer class.x -> Object class.x
//  

// what kotlin does:
// +a       a.unaryPlus()
// -a       a.unaryMinus()
// !a       a.not()
// a++      a.inc()
// a--      a.dec()
// a+b      a.plus(b)
// a-b      a.minus(b)
// a*b      a.times(b)
// a/b      a.div(b)
// a%b      a.rem(b)
// a..b     a.rangeTo(b)
// a..<b    a.rangeUntil(b)
// a in b   b.contains(a)
// a !in b  !b.contains(a)
// a[i]     a.get(i)
// a[i,j]   a.get(i,j)
// a[i]=b   a.set(i, b)
// a()      a.invoke()
// a(i)     a.invoke(i)
// a+=b     a.plusAssign(b)
// a-=b     a.minusAssign(b)
// a*=b     a.timesAssign(b)
// a/=b     a.divAssign(b)
// a%=b     a.remAssign(b)
// a==b     a?.equals(b) ?: (b === null)
// a!=b     !(a?.equals(b) ?: (b === null))
// a>b      a.compareTo(b) > 0
// a<b      a.compareTo(b) < 0
// a>=b     a.compareTo(b) >= 0
// a<=b     a.compareTo(b) <= 0

const smalltalkMethodNameToJsMethodName = new Map<string, string>([
    ["+", "$add"],
    ["-", "$sub"],
    ["*", "$mul"],
    ["/", "$div"],
    ["//", "$idiv"],
    ["//", "$mod"],
    ["@", "$dot"],
    ["<", "$lt"],
    ["<=", "$le"],
    [">", "$gt"],
    [">=", "$ge"],
    ["=", "$eq"],
    ["~=", "$ne"],
    [",", "$comma"]
    // //
    // \\
])

/**
 * convert smalltalk method name into javascript one
 */
export function st_method_name(s: string): string {
    const name = smalltalkMethodNameToJsMethodName.get(s)
    if (name !== undefined) {
        return name
    }
    return '_' + s.replace(/:/g, "_")
}

export function makeGlobalScope() {
    const scope = new Scope()
    initialize()
    return scope
}
