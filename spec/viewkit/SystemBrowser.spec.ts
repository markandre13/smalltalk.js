import { beforeAll, describe, expect, it } from "vitest"
import { SystemBrowserModel } from "../../src/appkit/SystemBrowserModel"
import { CodeFile, ST_ProtocolType } from "../../src/codefile"

describe("SystemBrowser", () => {
    let codefile: CodeFile
    beforeAll(async () => {
        const filename = "files/Smalltalk-80.sources"
        const response = await fetch(filename)
        const bytes = await response.bytes()
        codefile = new CodeFile(filename, bytes)
    })

    it("can select all", async () => {
        const model = new SystemBrowserModel(codefile)
        expect(model.categories.length).to.equal(40)
        expect(model.categories.at(0)).to.equal("Collections-Abstract")
        expect(model.classes.length).to.equal(0)

        model.selectedCategory.value = 0
        expect(model.classes.length).to.equal(3)

        model.selectedClass.value = 0
        expect(model.protocols.length).to.equal(4)

        model.selectedType.value = ST_ProtocolType.CLASS
        expect(model.protocols.length).to.equal(1)

        model.selectedProtocol.value = 0
        expect(model.methods.length).to.equal(6)

        model.selectedMethod.value = 0
        expect(model.code.value).to.match(/Answer a new instance of me/)
    })

    it.only("selecting protocol clears method", () => {
        const model = new SystemBrowserModel(codefile)
        model.selectedCategory.value = 0
        model.selectedClass.value = 0
        // model.selectedType.value = ST_ProtocolType.CLASS
        model.selectedProtocol.value = 0
        model.selectedMethod.value = 0

        model.selectedProtocol.value = 1
        expect(model.selectedMethod.value).to.equal(null)

        model.selectedClass.value = 1
        expect(model.selectedProtocol.value).to.equal(null)

        model.selectedCategory.value = 1
        expect(model.selectedClass.value).to.equal(null)

        model.selectedClass.value = 0
        model.selectedProtocol.value = 0

        model.selectedType.value = 1
        expect(model.selectedProtocol.value).to.equal(null)
    })
})
