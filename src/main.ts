import { evaluate, makeGlobalScope, Transcript } from "./evaluate"
import { program, setLexer } from "./parser"

const workspace = document.createElement("pre")
workspace.title = 'Transcript'
workspace.style.left = "16px"
workspace.style.top = "20px"
workspace.style.width = "640px"
workspace.style.height = "240px"
workspace.textContent = 'Welcome to the smalltalk.js system\n'

const scope = makeGlobalScope()

const repl = document.createElement("pre")
repl.title = 'Workspace'
repl.style.left = "16px"
repl.style.top = "292px"
repl.style.width = "640px"
repl.style.height = "120px"
repl.contentEditable = "true"
repl.onkeydown = (ev: KeyboardEvent) => {
    if (ev.key === "Enter") {
        const s = document.createElement("span")
        s.innerText = `# ${repl.textContent}\n`
        workspace.appendChild(s)
        try {
            Transcript.transcript = ""
            setLexer(repl.textContent)
            const node = program()
            const r = evaluate(node!, scope)
            if (r?.value !== undefined) {
                const s = document.createElement("span")
                s.style.color = "#0000ff"
                s.innerText = `${r.value}\n`
                workspace.appendChild(s)
            }
            if (Transcript.transcript.length > 0) {
                const s = document.createElement("span")
                s.style.color = "#0000ff"
                s.innerText = `${Transcript.transcript}\n`
                workspace.appendChild(s)
            }
        } catch (e) {
            console.error(e)
            if (e instanceof Error) {
                const s = document.createElement("span")
                s.style.color = "#ff0000"
                s.innerText = `${e.message}\n`
                workspace.appendChild(s)
            }
        }
    }
}

function minmax(value: number, min: number, max: number) {
    return Math.max(Math.min(value, max), min)
}

class Decoration {
    element: HTMLElement
    titlebar: HTMLElement
    constructor(wm: WindowManager, element: HTMLElement) {
        const titlebar = document.createElement('div')
        this.titlebar = titlebar
        this.element = element
        titlebar.dataset["wm"] = "true"
        titlebar.appendChild(document.createTextNode(element.title))
        titlebar.className = 'wm-titlebar'

        const elementRect = element.getBoundingClientRect()
        titlebar.style.left = `${elementRect.left}px`
        titlebar.style.top = `${elementRect.top - 19}px`

        let move = false, downX = 0, downY = 0, desktop: DOMRect, titleRect: DOMRect
        titlebar.onpointerdown = (ev: PointerEvent) => {
            ev.preventDefault()

            if (wm.active !== this) {
                if (wm.active !== undefined) {
                    wm.active.titlebar.classList.remove("active")
                    wm.active.element.classList.remove("active")
                }
                wm.active = this
                this.titlebar.classList.add("active")
                this.element.classList.add("active")
            }
            titlebar.setPointerCapture(ev.pointerId)
            move = true
            desktop = document.body.getBoundingClientRect()
            titleRect = titlebar.getBoundingClientRect()
            downX = ev.clientX - titleRect.left
            downY = ev.clientY - titleRect.top
        }
        titlebar.onpointermove = (ev: PointerEvent) => {
            if (move) {
                ev.preventDefault()
                const keepSize = 16
                const left = minmax(ev.clientX - downX, keepSize - titleRect.width, desktop.width - keepSize)
                const top = minmax(ev.clientY - downY, keepSize - titleRect.height, desktop.height - keepSize)
                titlebar.style.left = `${left}px`
                titlebar.style.top = `${top}px`
                element.style.left = `${left}px`
                element.style.top = `${top + titleRect.height}px`
            }
        }
        titlebar.onpointerup = (ev: PointerEvent) => {
            if (move) {
                ev.preventDefault()
                move = false
            }
        }
        document.body.appendChild(titlebar)
    }
}

/**
 * Window Manager
 * 
 * The [window manager](https://en.wikipedia.org/wiki/Window_manager) adds a title and a
 * frame to all elements added to document.body, allowing them to be moved, minimized and
 * closed.
 */
class WindowManager {
    private element2decoration = new Map<Element, Decoration>()
    active?: Decoration

    constructor() {
        const mutate = new MutationObserver((mutations: MutationRecord[]) => {
            // console.log(`childlist changed`)
            // console.log(mutations)
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes) {
                        if (node instanceof HTMLElement) {
                            if (node.dataset["wm"] === "true") {
                                continue
                            }
                            this.element2decoration.set(node, new Decoration(this, node))
                        }
                    }
                    for (const node of mutation.removedNodes) {

                    }
                }
            }
        })
        mutate.observe(document.body, { childList: true })
    }
}
const dt = new WindowManager()


// document.body.replaceChildren(transcript, repl, floating)
document.body.appendChild(workspace)
document.body.appendChild(repl)