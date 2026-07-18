import { Type } from "./type"

export class Node {
    type: Type
    text?: string

    typeParent: Node | undefined
    child: Array<Node | undefined>

    constructor(type: Type, text?: string) {
        this.type = type
        this.text = text
        this.child = new Array<Node | undefined>()
    }

    append(node: Node) {
        this.child.push(node)
    }

    toString(): string {
        if (this.text !== undefined)
            return `${Type[this.type]} '${this.text}'`
        return Type[this.type]
    }

    printTree(depth: number = 0) {
        const indent = "    ".repeat(depth)
        console.log(indent + this.toString())
        for (let c of this.child) {
            if (c === undefined) {
                console.log(indent + "    undefined")
            } else {
                c.printTree(depth + 1)
            }
        }
    }
    flattenTree(out: any[], depth: number = 0) {
        out.push([depth, this.type, this.text])
        for (let c of this.child) {
            if (c === undefined) {
                out.push([depth + 1, undefined, undefined])
            } else {
                c.flattenTree(out, depth + 1)
            }
        }
    }
}
