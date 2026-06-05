// read smalltalk code files (.sources and .changes files)
//
// the code file format is explained in
//
// Glenn Krasner, editor. Smalltalk-80: Bits of History, Words of Advice. 
// Addison-Wesley Longman Publishing Co., Inc., Boston, MA, USA, 1983.
// chapter 3: The Smalltalk-80 Code File Format, p.29
//
// at the moment this is intended to provide a yet to be implemented
// system browser with data and later to test the parser

// <string>!
// <superclass> subclass: #<class>...!
// <class> comment: <string>!
// !<class> methodsFor: '<category>'!
// <methodname>
//   <body>!
// <aga
// ! !

// 0x0c formfeed (FF)
// 0x0d cr
// 0x09 horizontal tab

// the following returns a ClassCategoryReader which will read the methods
//   !ActionMenu methodsFor: 'action symbols'!
// and
//   ! ! <-- empty chunk marks the end

const EXCLAMATION_MARK = 0x21

type CategoryName = string
type ClassName = string
type ProtocolName = string
type SelectorName = string

enum Stream {
    SOURCES,
    CHANGES
}

class ST_Method {
    name!: SelectorName
    stream!: Stream
    offset!: number
}

class ST_Protocol {
    methods = new Map<SelectorName, ST_Method>()
}

class ST_Class {
    name: ClassName
    superClassName: ClassName
    comment?: string
    protocols = new Map<ProtocolName, ST_Protocol>()
    classProtocols = new Map<ProtocolName, ST_Protocol>()
    constructor(className: ClassName, superClassName: ClassName) {
        this.name = className
        this.superClassName = superClassName
    }
}

enum ST_ProtocolType {
    INSTANCE,
    CLASS
}

// PopUpMenu subclass: #ActionMenu
// ActionMenu comment: ...'string'
// ActionMenu methodsFor: 'action symbols'

// ActionMenu class ... instanceVariableNames: ''
// ActionMenu class comment:
// ActionMenu class methodsFor: 'instance creation'

// selectorAt: index

// beSnapshotSerialNumber: aByteArray leaderVirtualDiskAddr: anInteger
// <primitive: 135>
// self primitiveFailed

// import { readFileSync } from "fs"
// const filename = "files/Smalltalk-80.sources"
// const b = readFileSync(filename)

export class CodeFile {
    filename: string
    buffer: Uint8Array
    offset = 0

    categories = new Map<CategoryName, Map<ClassName, ST_Class>>()
    classes = new Map<ClassName, ST_Class>()

    constructor(filename: string, buffer: Uint8Array) {
        this.filename = filename
        this.buffer = buffer
        this.parse()

        // while (true) {
        //     const txt = this.chunk()
        //     if (txt === null) {
        //         break
        //     }
        //     console.log(txt)
        //     console.log("---------------------------------------------------------------------")
        // }
    }

    /**
     * since the Smalltalk parser is not complete yet, we will parse the original Smalltalk-80 v2
     * source code using with regex
     */
    parse() {
        let inMethodsSection = false
        let className!: string
        let clazz!: ST_Class
        let protocol!: string
        let type!: ST_ProtocolType

        const categories = this.categories

        while (true) {
            const chunkStart = this.offset
            const txt = this.chunk()
            if (txt === null) {
                break
            }
            const chunkEnd = this.offset
            let m: RegExpMatchArray | null
            if (inMethodsSection) {
                if (txt === "") {
                    // console.log('END METHODS')
                    inMethodsSection = false
                } else {
                    if (clazz === undefined) {
                        throw Error(`OOPS: undefined class ${className}`)
                    }

                    const selector = txt.split('\n')[0]!
                    // console.log(`    ${className!} | ${protocol!} | ${selector}`)

                    let protocols
                    switch (type) {
                        case ST_ProtocolType.CLASS:
                            protocols = clazz.classProtocols
                            break
                        case ST_ProtocolType.INSTANCE:
                            protocols = clazz.protocols
                            break
                        default:
                            throw Error(`unknow type ${type}`)
                    }
                    if (protocols === undefined) {
                        console.log(`OOPS: no ${ST_ProtocolType[type]} protocol ${protocol}`)
                    }
                    let proto = protocols!.get(protocol)
                    if (proto === undefined) {
                        proto = new ST_Protocol()
                        protocols!.set(protocol, proto)
                    }
                    const method = new ST_Method()
                    method.offset = chunkStart
                    proto.methods.set(selector, method)
                    // printed = true
                }
                continue
            }
            m = txt.match(/^template: (\w+)/)
            if (m) {
                continue
            }
            m = txt.match(/^(\w+) class methodsFor: '(.*)'/)
            if (m) {
                inMethodsSection = true
                type = ST_ProtocolType.CLASS
                className = m[1]!
                protocol = m[2]!
                // console.log(txt)
                // console.log(`METHODS FOR CLASS ${className}, PROTOCOL: ${protocol}`)
                clazz = this.classes.get(className)!
                continue
            }
            m = txt.match(/^(\w+) methodsFor: '(.*)'/)
            if (m) {
                inMethodsSection = true
                type = ST_ProtocolType.INSTANCE
                className = m[1]!
                protocol = m[2]!
                // console.log(txt)
                // console.log(`METHODS FOR INSTANCE ${className}, PROTOCOL: ${protocol}`)
                clazz = this.classes.get(className)!
                continue
            }
            m = txt.match(/^(.*) subclass: #(.*)/)
            if (!m) {
                m = txt.match(/^(.*) variableSubclass: #(.*)/)
            }
            if (!m) {
                m = txt.match(/^(.*) variableByteSubclass: #(.*)/)
            }
            if (!m) {
                m = txt.match(/^(.*) variableWordSubclass: #(.*)/)
            }
            if (m) {
                const superClass = m[1]!
                const subClass = m[2]!
                m = txt.match(/category: '(.*)'/)
                const category = m![1]!
                if (category.includes("'")) {
                    console.log(txt)
                }

                let categoryEntry = categories.get(category)
                if (categoryEntry === undefined) {
                    categoryEntry = new Map()
                    categories.set(category, categoryEntry)
                }
                if (categoryEntry.has(subClass)) {
                    throw Error('duplicate')
                }
                // console.log(txt)
                // console.log(`CLASS ${subClass}: ${superClass}`)
                const clazz = new ST_Class(subClass, superClass)
                categoryEntry.set(subClass, clazz)
                this.classes.set(subClass, clazz)
                continue
            }
        }

        // for(let categoryName of Array.from(categories.keys()).sort()) {
        //     console.log(categoryName)
        // }
    }
    /**
     * Smalltalk-80 code files are separated into chunks, marked by a single '!'.
     * '!!' is an escape to mark for '!'
     */
    chunk() {
        if (this.offset >= this.buffer.length) {
            return null
        }

        let txt = ""
        while (this.offset < this.buffer.length) {
            let byte = this.buffer[this.offset++]!
            if (byte === EXCLAMATION_MARK) {
                const nextByte = this.buffer[this.offset]!
                if (nextByte !== EXCLAMATION_MARK) {
                    break
                }
            }
            switch (byte) {
                case 0x0c:
                    break
                case 0x0d:
                    txt += '\n'
                    break
                case 0x09:
                    txt += '\t'
                    break
                default:
                    txt += String.fromCharCode(byte)
            }
        }
        return txt.trim()
    }

    // TODO: Some methods contain a text like
    //   See Object documentation whatIsAPrimitive.
    // which is of the format
    //   See <class> <protocol> <selector>
    // and references a method like this:
    //   Object class methodsFor: 'documentation'
    //   whatIsAPrimitive
    //         "..."
    //         self error: 'comment only'
    // that would be a nice place to render a link
    getCode(method: ST_Method) {
        this.offset = method.offset
        const code = this.chunk()!
        // console.log(code)
        return code
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('^', '↑')
            .replaceAll('_', '←')
            // .replaceAll('\n', '<br/>')
            // .replaceAll('\t', '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;')
    }
}

// new CodeFile("files/Smalltalk-80.sources")
// new CodeFile(filename, b)
