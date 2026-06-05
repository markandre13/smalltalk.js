import { View } from "./View";

export class CodeView extends View {
    constructor() {
        super("pre");
        this.element.classList.add("codeview");
        this.element.contentEditable = "true";
    }
}
