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
import { lstatSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs"

// 0x0c formfeed (FF)
// 0x0d cr
// 0x09 horizontal tab

// the following returns a ClassCategoryReader which will read the methods
//   !ActionMenu methodsFor: 'action symbols'!
// and
//   ! ! <-- empty chunk marks the end

const EXCLAMATION_MARK = 0x21

// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃                 System Browser                ┃
// ┣━━━━━━━━━━━┳━━━━━━━━━━━┳━━━━━━━━━━━┳━━━━━━━━━━━┫
// ┃Categories ┃ Classes   ┃ Protocols ┃ Methods   ┃
// ┃           ┃           ┃           ┃           ┃
// ┃           ┃           ┃           ┃           ┃
// ┃           ┃           ┃           ┃           ┃
// ┃           ┃           ┃           ┃           ┃
// ┃           ┣━━━━━━━━━━━┫           ┃           ┃
// ┃           ┃◉ instance ┃           ┃           ┃
// ┃           ┃◯ class    ┃           ┃           ┃
// ┣━━━━━━━━━━━┻━━━━━━━━━━━┻━━━━━━━━━━━┻━━━━━━━━━━━┫
// ┃ CodeView                                      ┃
// ┃                                               ┃
// ┃                                               ┃
// ┃                                               ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

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
    constructor(className: ClassName, superClassName: ClassName) {
        this.name = className
        this.superClassName = superClassName
    }
}

const categories = new Map<CategoryName, Map<ClassName, ST_Class>>()

let inMethodsFor = false
let className: string
let protocol: string

const a = readFileSync("Smalltalk-80.sources")
for (let offset = 0, chunk_start = 0; offset < a.length; ++offset) {
    const byte = a[offset]!
    if (byte === EXCLAMATION_MARK) {
        if (a[offset + 1] !== EXCLAMATION_MARK) {
            const chunk_end = offset - 1
            // console.log(`${chunk_start} - ${offset}`)
            let txt = ""
            for (let i = chunk_start; i <= chunk_end; ++i) {
                let code = a[i]!, char
                switch (code) {
                    case 0x0c:
                        char = ''
                        break
                    case 0x0d:
                        char = '\n'
                        break
                    case 0x09:
                        char = '\t'
                        break
                    default:
                        char = String.fromCharCode(code)
                }
                txt += char
            }
            txt = txt.trim()
            let printed = false
            if (inMethodsFor) {
                if (txt === "") {
                    // console.log('END METHODS')
                    inMethodsFor = false
                } else {
                    const selector = txt.split('\n')[0]
                    printed = true
                    console.log(`    ${className!} | ${protocol!} | ${selector}`)
                }
            } else {
                let m = txt.match(/(\w+) class methodsFor: '(.*)'/)
                if (m !== null) {
                } else {
                    m = txt.match(/(\w+) methodsFor: '(.*)'/)
                    if (m !== null) {
                        // console.log('START METHODS')
                        printed = true
                        className = m[1]!
                        protocol = m[2]!
                        inMethodsFor = true
                    } else {
                        m = txt.match(/(.*) subclass: #(.*)/)
                        if (m) {
                            const superClass = m[1]!
                            const subclass = m[2]!

                            m = txt.match(/category: '(.*)'/)
                            const category = m![1]!
                            console.log(`${category} | ${subclass}: ${superClass}`)
                            printed = true

                            let categoryEntry = categories.get(category) 
                            if (categoryEntry === undefined) {
                                categoryEntry = new Map()
                                categories.set(category, categoryEntry)
                            }
                            if (categoryEntry.has(subclass)) {
                                throw Error('duplicate')
                            }
                            categoryEntry.set(subclass, new ST_Class(subclass, superClass))
                        }
                    }
                }
            }
            // if (!printed) {
            //     console.log(txt.trim())
            //     if (inMethodsFor) {
            //         console.log("-------------------------------------------------------------")
            //     } else {
            //         console.log("=============================================================")
            //     }
            // }

            chunk_start = offset + 1
        }
    }
}