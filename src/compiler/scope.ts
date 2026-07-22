import type { ST_Class } from "../classes/kernel/ST_Class"

export enum ScopeType {
    GLOBAL,
    OBJECT,
    BLOCK
}

export class Scope {
    static readonly localVariable = Symbol("local-variable")
    static readonly objectVariable = Symbol("object-variable")
    static readonly globalVariable = Symbol("global-variable")

    type: ScopeType
    private parent?: Scope
    clazz?: ST_Class
    private instanceVariables?: Set<string>
    private map = new Map<string, any>();
    constructor(parent: Scope | undefined = undefined, clazz?: ST_Class) {
        this.parent = parent
        if (clazz) {
            this.type = ScopeType.OBJECT
            this.clazz = clazz
            this.instanceVariables = new Set(clazz.instanceVariables!.value.split(" ").map((it: string) => it.trim()))
            // console.log(`CREATE CLASS SCOPE ${instanceVariables}`)
        } else {
            this.type = ScopeType.GLOBAL
        }
    }
    init(name: string, variable: any) {
        this.map.set(name, variable)
    }
    set(name: string, variable: any) {
        let scope: Scope | undefined = this
        while (scope !== undefined && !scope.map.has(name)) {
            scope = scope.parent
        }
        if (scope === undefined) {
            scope = this
        }
        scope.map.set(name, variable)
    }
    get(name: string): any {
        if (this.instanceVariables) {
            if (this.instanceVariables.has(name)) {
                return Scope.objectVariable
            }
        }

        const value = this.map.get(name)
        if (value !== undefined) {
            return value
        }
        if (this.parent === undefined) {
            return Scope.globalVariable
            // if ((window as any).Smalltalk.privateHas(name)) {
            //     return ST_Scope.globalVariable
            // }
            // console.log((window as any).Smalltalk)
            // throw Error(`variable ${name} does not exist`)
        }
        return this.parent.get(name)
    }
}
