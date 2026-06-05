export class View<T extends HTMLElement = HTMLElement> {
    element: T;
    constructor(tagName: string) {
        // super()
        this.element = document.createElement(tagName) as T;
    }
    get classList() { return this.element.classList; }
    get title() { return this.element.title; }
    set title(value: string) { this.element.title = value; }
    appendChild(child: View) {
        this.element.appendChild(child.element);
    }
}
