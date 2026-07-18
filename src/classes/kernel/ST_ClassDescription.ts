import type { ST_String } from "../ST_String"
import { ST_Behaviour } from "./ST_Behaviour"
import { ST_ClassOrganizer } from "./ST_ClassOrganizer"

export class ST_ClassDescription extends ST_Behaviour {
    instanceVariables?: ST_String
    organization?: ST_ClassOrganizer

    /**
     * Set the receiver's comment to be the argument, aString.
     */
    _comment_(aString: ST_String) {
        this._organization()._classComment_(aString)
    }
    /**
     * Answer the receiver's comment.
     */
    _comment() {
        return this._organization()._classComment()
    }
    /**
     * Answer the instance of ClassOrganizer that represents the organization
     * of the messages of the receiver.
     */
    _organization() {
        if (this.organization === undefined) {
            this.organization = new ST_ClassOrganizer()
        }
        return this.organization
    }
}
