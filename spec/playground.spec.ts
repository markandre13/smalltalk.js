import { expect, it, describe } from "vitest"
import {  program, setLexer } from "../src/parser"
import { evaluate } from "../src/evaluate"
import { ST_Array } from "../src/classes/ST_Array"
import { ST_Number } from "../src/classes/ST_Number"
import { ST_String } from "../src/classes/ST_String"


describe.skip("playground", () => {
    it("a := #('quick' 'brown' 'fox')", () => {
        setLexer(`a := #('quick' 8 'fox')`)
        const node = program()
        const r = evaluate(node!)
        expect(r).toBeInstanceOf(ST_Array)
        expect(r).toEqual([new ST_String('quick'), new ST_Number(8), new ST_String("fox")])
    })
    // nested := Array with: 'the' with: 'other'.

})
