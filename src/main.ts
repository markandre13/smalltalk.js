import { Canvas } from "./viewkit/Canvas"
import { evaluate, makeGlobalScope, Transcript } from "./evaluate"
import { program, setLexer } from "./parser"
import { SystemBrowser } from "./viewkit/SystemBrowser"
import { WindowManager } from "./viewkit/WindowManager"

const workspace = document.createElement("pre")
workspace.textContent = 'Welcome to Smalltalk.JS - personal computing for children of all ages\n'

const canvas = new Canvas()

const scope = makeGlobalScope()

const repl = document.createElement("pre")
repl.innerText = `pen := Pen new.
1 to: 150 do: [ :i | pen go: 10; turn: (i / 3). ]`

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


const systemBrowser = new SystemBrowser().element


const wm = new WindowManager()

wm.appendChild(workspace, "Transcript", 16, 0, 640, 240)
wm.appendChild(repl, "Workspace", 16, 240, 640, 120)
wm.appendChild(canvas.div, "Display", 16, 360, 640, 400)
wm.appendChild(systemBrowser, "System Browser", 16 + 32, 360 + 32, 640, 400)
