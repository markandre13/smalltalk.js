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

    node?.printTree()

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
    scope.clazz.prototype[st_method_name(identifier)] = method

    console.log("OK")

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
        console.error(code)
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

            expect(globalThis.st.dot.x.value).to.equal(3)
            expect(globalThis.st.dot.y.value).to.equal(5)
        })
        it.skip("debug", () => {
            evaluateSource(`
Object subclass: #Point
	instanceVariableNames: 'x y '
	classVariableNames: ''
	poolDictionaries: ''
	category: 'Graphics-Primitives'!

Point comment: 'I am an x-y pair of numbers usually designating a location on the screen'!

!Point methodsFor: 'something'!
= aPoint 
        self species = aPoint species
                ifTrue: [^x = aPoint x and: [y = aPoint y]]
                ifFalse: [^false]
            `)

            // FIXME
            // [^false] does not need to insert a return
            // true, false are instances of True, False
            // nil is an instance of UndefinedObject

            let code
            // wrong
            code = ";return (st.self)._species().$eq((aPoint)._species())._ifTrue_ifFalse_((()=>return (this.x).$eq((aPoint)._x())._and_((()=>(this.y).$eq((aPoint)._y())))),(()=>return st.false));"
            // correct
            code = ";return (st.self)._species().$eq((aPoint)._species())._ifTrue_ifFalse_((()=>(this.x).$eq((aPoint)._x())._and_((()=>(this.y).$eq((aPoint)._y())))),(()=>st.false));"

        })
        it("Point", () => {
            evaluateSource(`
Object subclass: #Point
	instanceVariableNames: 'x y '
	classVariableNames: ''
	poolDictionaries: ''
	category: 'Graphics-Primitives'!

Point comment: 'I am an x-y pair of numbers usually designating a location on the screen'!

!Point methodsFor: 'accessing'!
x
	"Answer the x coordinate."
	^x!
x: xInteger 
	"Set the x coordinate."
	x _ xInteger!
y
	"Answer the y coordinate."
	^y!
y: yInteger 
	"Set the y coordinate."
	y _ yInteger! !
!Point methodsFor: 'comparing'!
< aPoint 
	"Answer whether the receiver is 'above and to the left' of aPoint."
	^x < aPoint x and: [y < aPoint y]!
<= aPoint 
	"Answer whether the receiver is 'neither below nor to the right' of aPoint."

	^x <= aPoint x and: [y <= aPoint y]!
= aPoint 
	self species = aPoint species
		ifTrue: [^x = aPoint x and: [y = aPoint y]]
		ifFalse: [^false]!
> aPoint 
	"Answer whether the receiver is 'below and to the right' of aPoint."

	^x > aPoint x and: [y > aPoint y]!
>= aPoint 
	"Answer whether the receiver is 'neither above nor to the left' of aPoint."

	^x >= aPoint x and: [y >= aPoint y]!
hash
	^(x hash bitShift: 2) bitXor: y hash!
hashMappedBy: map
	"My hash is independent of my oop"
	^ self hash!
max: aPoint 
	"Answer the lower right corner of the rectangle uniquely defined  
	by the receiver and aPoint."

	^Point
		x: (x max: aPoint x)
		y: (y max: aPoint y)!
min: aPoint 
	"Answer the upper left corner of the rectangle uniquely defined 
	by the receiver and aPoint."

	^Point 
		x: (x min: aPoint x)
		y: (y min: aPoint y)! !

!Point methodsFor: 'arithmetic'!
* scale 
	"Answer a new Point that is the product of the receiver and scale (which is a 
	Point or Number)."

	| scalePoint |
	scalePoint _ scale asPoint.
	^x * scalePoint x @ (y * scalePoint y)!
+ delta 
	"Answer a new Point that is the sum of the receiver and delta (which is a Point 
	or Number)."

	| deltaPoint |
	deltaPoint _ delta asPoint.
	^x + deltaPoint x @ (y + deltaPoint y)!
- delta 
	"Answer a new Point that is the difference of the receiver and delta (which is a 
	Point or Number)."

	| deltaPoint |
	deltaPoint _ delta asPoint.
	^x - deltaPoint x @ (y - deltaPoint y)!
/ scale 
	"Answer a new Point that is the quotient of the receiver and scale (which is a 
	Point or Number)."

	| scalePoint |
	scalePoint _ scale asPoint.
	^x / scalePoint x @ (y / scalePoint y)!
// scale 
	"Answer a new Point that is the quotient of the receiver and scale (which is a 
	Point or Number)."

	| scalePoint |
	scalePoint _ scale asPoint.
	^x // scalePoint x @ (y // scalePoint y)!
abs
	"Answer a new Point whose x and y are the absolute values of the receiver's
	x and y."

	^Point x: x abs y: y abs! !

!Point methodsFor: 'truncation and round off'!
rounded
	"Answer a new Point that is the receiver's x and y rounded."

	^x rounded @ y rounded!
truncateTo: grid
	"Answer a new Point that is the receiver's x and y truncated to grid x and grid y."

	^(x truncateTo: grid) @ (y truncateTo: grid)! !

!Point methodsFor: 'polar coordinates'!
r
	"Answer the receiver's radius in polar coordinate system."

	^(self dotProduct: self) sqrt!
theta
	"Answer the angle the receiver makes with origin in radians.   
	right is 0; down is 90."

	| tan theta |
	x = 0
		ifTrue: [y >= 0
				ifTrue: [^1.5708"90.0 degreesToRadians"]
				ifFalse: [^4.71239"270.0 degreesToRadians"]]
		ifFalse: 
			[tan _ y asFloat / x asFloat.
			theta _ tan arcTan.
			x >= 0
				ifTrue: [y >= 0
						ifTrue: [^theta]
						ifFalse: [^360.0 degreesToRadians + theta]]
				ifFalse: [^180.0 degreesToRadians + theta]]! !

!Point methodsFor: 'point functions'!
dist: aPoint 
	"Answer the distance between aPoint and the receiver."

	^(aPoint - self) r!
dotProduct: aPoint 
	"Answer a Number that is the dot product of the receiver and the argument, aPoint.
	That is, the two points are multipled and the coordinates of the result summed."

	| temp |
	temp _ self * aPoint.
	^temp x abs + temp y abs!
grid: aPoint 
	"Answer a new Point to the nearest rounded grid modules specified 
	by aPoint."

	| newX newY |

	aPoint x = 0
		ifTrue:	[newX _ 0]
		ifFalse:	[newX _ x roundTo: aPoint x].
	aPoint y = 0
		ifTrue:	[newY _ 0]
		ifFalse:	[newY _ y roundTo: aPoint y].
	^newX @ newY!
normal
	"Answer a new Point representing the unit vector rotated 90 deg toward the y axis."

	^(y negated @ x) unitVector!
pointNearestLine: point1 to: point2
	"Answers the closest integer point to the receiver on the line determined by (point1, point2)."

	| relPoint delta |
	delta _ point2 - point1. 			"normalize coordinates"
	relPoint _ self - point1.
	delta x = 0 ifTrue: [^point1 x@y].
	delta y = 0 ifTrue: [^x@point1 y].
	delta x abs > delta y abs 		"line more horizontal?"
		ifTrue: [^x@(point1 y + (x * delta y // delta x))]
		ifFalse: [^(point1 x + (relPoint y * delta x // delta y))@y]

	"43@55 pointNearestLine: 10@10 to: 100@200"!
transpose
	"Answer a new Point whose x is the receiver's y and whose y is the receiver's x."

	^y @ x!
truncatedGrid: aPoint 
	"Answer a new Point to the nearest truncated grid modules specified 
	by aPoint."

	^(x truncateTo: aPoint x) @ (y truncateTo: aPoint y)!
unitVector
	"Answer the receiver scaled to unit length."
	^self / self r! !

!Point methodsFor: 'converting'!
asPoint
	"Answer the receiver itself."
	^self!
corner: aPoint 
	"Answer a new Rectangle whose origin is the receiver and whose corner is aPoint.
	This is one of the infix ways of expressing the creation of a rectangle."

	^Rectangle origin: self corner: aPoint!
extent: aPoint 
	"Answer a new Rectangle whose origin is the receiver and whose extent is aPoint. 
	This is one of the infix ways of expressing the creation of a rectangle."

	^Rectangle origin: self extent: aPoint! !

!Point methodsFor: 'coercing'!
coerce: aNumber
	^aNumber@aNumber!
generality
	^90! !

!Point methodsFor: 'transforming'!
scaleBy: factor 
	"Answer a new Point scaled by factor (an instance of Point)."

	^(factor x * x) @ (factor y * y)!
translateBy: delta 
	"Answer a new Point translated by delta (an instance of Point)."

	^(delta x + x) @ (delta y + y)! !

!Point methodsFor: 'copying'!
deepCopy
	"Implemented here for better performance."
	^x deepCopy @ y deepCopy!
shallowCopy
	"Implemented here for better performance."
	^x @ y! !

!Point methodsFor: 'printing'!
printOn: aStream 
	"The receiver prints on aStream in terms of infix notation."

	x printOn: aStream.
	aStream nextPut: $@.
	y printOn: aStream!
storeOn: aStream

	aStream nextPut: $(;
	nextPutAll: self species name;
	nextPutAll: ' x: ';
	store: x;
	nextPutAll: ' y: ';
	store: y;
	nextPut: $).! !

!Point methodsFor: 'private'!
setX: xPoint setY: yPoint 
	x _ xPoint.
	y _ yPoint! !
"-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- "!

Point class
	instanceVariableNames: ''!

!Point class methodsFor: 'instance creation'!
x: xInteger y: yInteger 
	"Answer a new instance of me with coordinates xInteger and yInteger."
	^self new setX: xInteger setY: yInteger! !
`)

            // TODO: there are also methods for the class!!!

            console.log(globalThis.st.Point)
        })
    })
})
