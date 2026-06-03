import { evaluate } from "../evaluate";
import { Node } from "../node"
import { Type } from "../type";
import { ST_Scope } from "./ST_Scope";

export class ST_Closure {
    _args: Node | undefined = undefined;
    _tmps: Node | undefined = undefined;
    _stmt: Node | undefined = undefined;
    scope: ST_Scope;

    constructor(value: Node, scope: ST_Scope) {
        this.scope = scope;
        for (let child of value.child) {
            switch (child?.type) {
                case Type.SYN_BLOCK_ARGUMENTS:
                    this._args = child;
                    break;
                case Type.SYN_TEMPORARIES:
                    this._tmps = child;
                    break;
                default:
                    this._stmt = child;
            }
        }
    }
    _scope() {
        const closureScope = new ST_Scope(this.scope);
        if (this._tmps) {
            for (let tmp of this._tmps.child) {
                closureScope.init((tmp?.text)!, undefined);
            }
        }
        return closureScope;
    }
    // to evaluate a closure, it's value() method is called
    value() {
        const closureScope = this._scope();
        return evaluate(this._stmt, closureScope);
    }
    value_(arg0: any) {
        const closureScope = this._scope();
        closureScope.init((this._args?.child[0]?.text)!, arg0);
        return evaluate(this._stmt, closureScope);
    }
    value_value_(arg0: any, arg1: any) {
        const closureScope = this._scope();
        closureScope.init((this._args?.child[0]?.text)!, arg0);
        closureScope.init((this._args?.child[1]?.text)!, arg1);
        return evaluate(this._stmt, closureScope);
    }
    value_value_value_(arg0: any, arg1: any, arg2: any) {
        const closureScope = this._scope();
        closureScope.init((this._args?.child[0]?.text)!, arg0);
        closureScope.init((this._args?.child[1]?.text)!, arg1);
        closureScope.init((this._args?.child[2]?.text)!, arg2);
        return evaluate(this._stmt, closureScope);
    }
    valueWithArguments_(args: any) {
        const closureScope = this._scope();
        return evaluate(this._stmt, closureScope);
    }
}
