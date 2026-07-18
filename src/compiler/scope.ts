

export class Scope {
    static readonly localVariable = Symbol("local-variable")
    static readonly objectVariable = Symbol("object-variable")
    static readonly globalVariable = Symbol("global-variable")

    private parent?: Scope
    private map = new Map<string, any>();
    constructor(parent: Scope | undefined = undefined) {
        this.parent = parent
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
