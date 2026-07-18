export class ST_Behaviour {
    superclass: any
    methodDict: any
    format: any
    subclasses: any

    prototype = {} as any

    _new() {
        return {
            __proto__: this.prototype,
            _class: () => {
                return this
            }
        }
    }
}
