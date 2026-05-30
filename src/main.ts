import { evaluate, makeGlobalScope, Transcript } from "./evaluate"
import { program, setLexer } from "./parser"

const workspace = document.createElement("pre")
workspace.title = 'Transcript'
workspace.textContent = 'Welcome to Smalltalk.JS - personal computing for children of all ages\n'

const scope = makeGlobalScope()

const repl = document.createElement("pre")
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

interface FrameArea {
    name: string
}

const frameAreas: FrameArea[] = [
    { name: "n"},
    { name: "ne"},
    { name: "e"},
    { name: "se"},
    { name: "s"},
    { name: "sw"},
    { name: "w"},
    { name: "nw"},
]

class Decoration {
    frame: HTMLElement
    element: HTMLElement
    // titlebar: HTMLElement
    constructor(wm: WindowManager, element: HTMLElement, title: string, x: number, y: number, w: number, h: number) {
        this.element = element

        const frame = document.createElement("span")
        this.frame = frame
        frame.className = "wm-frame"
        frame.style.left = `${x}px`
        frame.style.top = `${y}px`
        frame.style.width = `${w}px`
        frame.style.height = `${h}px`

        const wmShadow = document.createElement("div")
        wmShadow.className = "wm-shadow"

        const areas = []
        for (const area of frameAreas) {
            const a = document.createElement("div")
            a.className = `wm-border wm-${area.name}`
            areas.push(a)
        }

        element.classList.add("wm-child")

        // the have the title bar twice:
        // * once as the 1st element in the back to create a box-shadow that
        //   is underneath the other elements
        // * once as the last element that overlays the other elements
        const titlebarShadow = document.createElement('div')
        // this.titlebar = titlebarShadow
        titlebarShadow.appendChild(document.createTextNode(title))
        titlebarShadow.className = 'wm-titlebar-shadow'

        const titlebar = document.createElement('div')
        // this.titlebar = titlebarShadow
        titlebar.appendChild(document.createTextNode(title))
        titlebar.className = 'wm-titlebar'

        let move = false, downX = 0, downY = 0, desktop: DOMRect, frameRect: DOMRect
        titlebar.onpointerdown = (ev: PointerEvent) => {
            ev.preventDefault()
            if (wm.active !== this) {
                if (wm.active !== undefined) {
                    wm.active.frame.classList.remove("active")
                }
                wm.active = this
                frame.classList.add("active")
            }
            titlebar.setPointerCapture(ev.pointerId)
            move = true
            desktop = document.body.getBoundingClientRect()
            frameRect = titlebar.getBoundingClientRect()
            downX = ev.clientX - frameRect.left
            downY = ev.clientY - frameRect.top
        }
        titlebar.onpointermove = (ev: PointerEvent) => {
            if (move) {
                ev.preventDefault()
                const keepSize = 16
                const left = minmax(ev.clientX - downX, keepSize - frameRect.width, desktop.width - keepSize)
                const top = minmax(ev.clientY - downY, keepSize - frameRect.height, desktop.height - keepSize)
                frame.style.left = `${left}px`
                frame.style.top = `${top}px`
            }
        }
        titlebar.onpointerup = (ev: PointerEvent) => {
            if (move) {
                ev.preventDefault()
                move = false
            }
        }
        frame.replaceChildren(titlebarShadow, wmShadow, ...areas, element, titlebar)
        document.body.appendChild(frame)
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
    }
    appendChild(node: HTMLElement, title: string, x: number, y: number, w: number, h: number) {
        this.element2decoration.set(node, new Decoration(this, node, title, x, y, w, h))
    }
}
const wm = new WindowManager()

wm.appendChild(workspace, "Transcript", 16, 20, 640, 240)
wm.appendChild(repl, "Workspace", 16, 292, 640, 120)
