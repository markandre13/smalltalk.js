import type { ValueModel } from "../appkit/ValueModel"
import { View } from "./View"

export class CodeView extends View {
    _model?: ValueModel<string>

    constructor() {
        super("pre")
        this.update = this.update.bind(this)
        this.element.classList.add("codeview")
        this.element.contentEditable = "true"
    }

    set model(model: ValueModel<string> | undefined) {
        if (this._model) {
            this._model.signal.remove(this)
        }
        this._model = model
        if (this._model) {
            this._model.signal.add(this.update, this)
        }
    }

    update() {
        this.element.innerHTML = this._model?.value ?? ""
    }
}
