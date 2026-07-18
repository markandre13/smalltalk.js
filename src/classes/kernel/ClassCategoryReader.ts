import type { ST_String } from "../ST_String"
import type { ST_Class } from "./ST_Class"

export class ClassCategoryReader {
    clazz: ST_Class
    category: ST_String
    constructor(clazz: ST_Class, category: ST_String) {
        this.clazz = clazz
        this.category = category
    }
}
