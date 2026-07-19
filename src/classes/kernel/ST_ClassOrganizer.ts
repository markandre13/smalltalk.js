import { ST_String } from "../collections/ST_String"

export class ST_ClassOrganizer {
    globalComment: ST_String | null = null;
    categoryArray: any
    categoryStops: any
    elementArray: any

    /**
     * Answer the comment associated with the object that refers to the receiver.
     */
    _classComment() {
        if (this.globalComment === undefined) {
            return new ST_String("")
        }
        return this.globalComment
    }
    _classComment_(aString: ST_String) {
        if (aString.value.length === 0) {
            this.globalComment = null
        } else {
            this.globalComment = aString
        }
    }
}
