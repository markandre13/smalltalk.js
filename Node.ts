import { Type } from "./Type";

export class Node {
    type: Type;
    text?: string;

    typeParent: Node | undefined;
    child: Array<Node | undefined>;

    constructor(type: Type, text?: string) {
        this.type = type;
        this.text = text;
        this.child = new Array<Node | undefined>();
    }

    append(node: Node) {
        this.child.push(node);
    }

    toString(): string {
        if (this.text)
            return `${Type[this.type]} '${this.text}'`
        return Type[this.type]
    }

    printTree(depth: number = 0) {
        let indent = ""
        for(let i=0; i<depth; ++i)
            indent = indent + "    "
        console.log(indent+this.toString())
        for(let c of this.child) {
            if (c===undefined) {
                console.log(indent+"    undefined")
            } else {
                c.printTree(depth+1)
            }
        }
    }
}
