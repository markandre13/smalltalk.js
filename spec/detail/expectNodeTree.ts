import type { Node } from "../../src/node"
import { Type } from "../../src/compiler/type"

export function expectNodeTree(node: Node, expect: [number, Type | undefined, string?][]) {
    const flat: [number, Type | undefined, string?][] = []
    node.flattenTree(flat)
    // console.log(flat)
    try {
        for (let i = 0; i < expect.length; ++i) {
            if (expect[i]![0] !== flat[i]![0]) {
                throw Error(`node number ${i}: expected depth ${expect[i]![0]} but found ${flat[i]![0]}`)
            }
            if (expect[i]![1] !== flat[i]![1]) {
                throw Error(`node number ${i}: expected type ${Type[expect[i]![1]!]} but found ${Type[flat[i]![1]!]}`)
            }
            if (expect[i]![2] !== undefined) {
                if (expect[i]![2] !== flat[i]![2]) {
                    throw Error(`node number ${i}: expected value ${expect[i]![2]} but found ${flat[i]![2]}`)
                }
            }
        }
        if (expect.length !== flat.length) {
            throw Error(`expected ${expect.length} nodes but got ${flat.length}`)
        }
    } catch (e) {
        console.log(`error: expected`)
        for (const e of expect) {
            if (e[2]) {
                console.log(`${"    ".repeat(e[0])}${Type[e[1]!]} '${e[2]}'`)
            } else {
                console.log(`${"    ".repeat(e[0])}${Type[e[1]!]}`)
            }
        }
        console.log(`but got`)
        node.printTree()
        throw e
    }
}
