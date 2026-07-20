/**
 * Behavior provides the minimum state necessary for compiling methods, and
 * creating and running instances.
 * Most objects are created as instances of the more fully supported subclass,
 * Class, but Behavior is a good starting point for providing instance-specific
 * behavior (as in Metaclass).
 */
export class ST_Behaviour {
    superclass: any
    methodDict: any
    format: any
    subclasses: any

    prototype = {} as any

    /**
     * Answer a new instance of the receiver (which is a class) with no indexable 
     * variables.  Fail if the class is indexable.  Essential.  See Object documentation 
     * whatIsAPrimitive. 
     */
    _new() {
        return {
            __proto__: this.prototype,
            _class: () => {
                return this
            }
        }
    }
    /**
     * Answer the receiver's superclass.  Only returns the first one
     *- use 'superclasses' to find them all."
     */
    _superclass() {
        return this.superclass
    }
}
