import type { ST_String } from "../collections/ST_String"
import type { ST_Class } from "./ST_Class"
import type { ST_ClassDescription } from "./ST_ClassDescription"

export class ClassCategoryReader {
    clazz: ST_ClassDescription
    category: ST_String
    constructor(clazz: ST_ClassDescription, category: ST_String) {
        this.clazz = clazz
        this.category = category
    }
}
