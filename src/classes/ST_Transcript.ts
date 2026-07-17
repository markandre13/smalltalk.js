export class ST_Transcript {
    static buffer = ''
    static _show_(value: any) {
        ST_Transcript.buffer += value.toString()
    }
    static _cr() {
        ST_Transcript.buffer += "\n"
    }
}