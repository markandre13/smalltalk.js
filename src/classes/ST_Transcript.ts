export class ST_Transcript {
    static buffer = ''
    static show_(value: any) {
        ST_Transcript.buffer += value.toString()
    }
    static cr() {
        ST_Transcript.buffer += "\n"
    }
}