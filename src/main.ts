import { evaluate, makeGlobalScope, Transcript } from "./evaluate"
import { program, setLexer } from "./parser"

const transcript = document.createElement("pre")
transcript.className = "transcript"
transcript.textContent = 'Welcome to the smalltalk.js system\n'

const scope = makeGlobalScope()

const repl = document.createElement("pre")
repl.contentEditable = "true"
repl.className = "repl"
repl.onkeydown = (ev: KeyboardEvent) => {
    if (ev.key === "Enter") {
        const s = document.createElement("span")
        s.innerText = `# ${repl.textContent}\n`
        transcript.appendChild(s)
        try {
            Transcript.transcript = ""
            setLexer(repl.textContent)
            const node = program()
            const r = evaluate(node!, scope)
            if (r?.value !== undefined) {
                const s = document.createElement("span")
                s.style.color = "#0000ff"
                s.innerText = `${r.value}\n`
                transcript.appendChild(s)
            }
            if (Transcript.transcript.length > 0) {
                const s = document.createElement("span")
                s.style.color = "#0000ff"
                s.innerText = `${Transcript.transcript}\n`
                transcript.appendChild(s)
            }
        } catch (e) {
            console.error(e)
            if (e instanceof Error) {
                const s = document.createElement("span")
                s.style.color = "#ff0000"
                s.innerText = `${e.message}\n`
                transcript.appendChild(s)
            }
        }
    }
}

document.body.replaceChildren(transcript, repl)
