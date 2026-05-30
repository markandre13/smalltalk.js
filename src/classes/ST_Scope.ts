
export class ST_Scope {
    private parent?: ST_Scope;
    private map = new Map<string, any>();
    constructor(parent: ST_Scope | undefined = undefined) {
        this.parent = parent;
    }
    init(name: string, variable: any) {
        this.map.set(name, variable);
    }
    set(name: string, variable: any) {
        let scope: ST_Scope | undefined = this;
        while (scope !== undefined && !scope.map.has(name)) {
            scope = scope.parent;
        }
        if (scope === undefined) {
            scope = this;
        }
        scope.map.set(name, variable);
    }
    get(name: string): any {
        if (!this.map.has(name)) {
            if (this.parent === undefined) {
                throw Error(`variable ${name} does not exist`);
            }
            return this.parent.get(name);
        }
        return this.map.get(name);
    }
}
