import type { ListModel } from "../appkit/ListModel"
import type { NumberModel } from "../appkit/NumberModel"
import { View } from "./View"

export class ListView extends View {
    private _list?: ListModel
    private _selection?: NumberModel
    constructor() {
        super("div")
        this.updateList = this.updateList.bind(this)
        this.updateSelection = this.updateSelection.bind(this)
        this.element.classList.add("listbox")
        this.element.onpointerdown = (ev: PointerEvent) => {
            ev.preventDefault()
            if (this._selection &&
                ev.target instanceof HTMLElement
                && ev.target.parentElement === this.element) {
                for (let i = 0; i < this.element.children.length; ++i) {
                    if (this.element.children[i] === ev.target) {
                        if (this._selection.value == i) {
                            this._selection.value = null
                        } else {
                            this._selection.value = i
                        }
                        break
                    }
                }
            }
        }
    }
    get value() {
        if (this._list && this._selection && this._selection.value !== null)
            return this._list.at(this._selection.value)
        return undefined
    }
    set list(aModel: ListModel | undefined) {
        if (this._list) {
            this._list.signal.remove(this.list)
        }
        this._list = aModel
        if (this._list) {
            this._list.signal.add(this.updateList, this.list)
        }
        this.updateList()
    }
    get list() { return this._list }
    set selection(aSelection: NumberModel | undefined) {
        if (this._selection) {
            this._selection.signal.remove(this.selection)
        }
        this._selection = aSelection
        if (this._selection) {
            this._selection.signal.add(this.updateSelection, this.selection)
        }
        this.updateSelection()
    }
    get selection() { return this._selection }

    updateList() {
        const children: HTMLElement[] = []
        if (this._list) {
            for (let text of this._list) {
                const item = document.createElement("div")
                item.appendChild(document.createTextNode(text))
                children.push(item)
            }
        }
        // children[0]?.classList.add("active");
        this.element.replaceChildren(...children)
    }
    updateSelection() {
        for (let i = 0; i < this.element.children.length; ++i) {
            this.element.children[i]!.classList.toggle("active", i === this._selection?.value)
        }
    }
}
