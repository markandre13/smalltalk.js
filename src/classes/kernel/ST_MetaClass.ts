import type { ST_Class } from "./ST_Class"
import { ST_ClassDescription } from "./ST_ClassDescription"

// Every class is an instance of a metaclass.
// ST_MetaClass is not subclassed
// When we want to 'Object subclass: #Point'
// we also 
class ST_MetaClass extends ST_ClassDescription {
    thisClass?: ST_Class
}
