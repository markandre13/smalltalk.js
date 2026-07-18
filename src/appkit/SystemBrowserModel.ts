import { ListModel } from "../appkit/ListModel"
import { NumberModel } from "../appkit/NumberModel"
import { ValueModel } from "../appkit/ValueModel"
import { ST_ProtocolType, type CodeFile } from "../compiler/codefile"
import { effect } from "../reactivity/computed"

export class SystemBrowserModel {
    categories = new ListModel()
    selectedCategory = new NumberModel()

    classes = new ListModel()
    selectedClass = new NumberModel()

    type = new ListModel(["instance", "class"])
    selectedType = new NumberModel(ST_ProtocolType.INSTANCE)

    protocols = new ListModel()
    selectedProtocol = new NumberModel()

    methods = new ListModel()
    selectedMethod = new NumberModel()

    code = new ValueModel<string>("")

    constructor(codefile: CodeFile) {
        // set the lists when an item is selected / deselected
        effect(() => {
            this.categories.value = Array.from(
                codefile.categories.keys()
            ).sort()
        })
        effect(() => {
            if (this.selectedCategory.value !== null) {
                this.classes.value = Array.from(
                    codefile.categories.get(
                        this.categories.at(this.selectedCategory.value)!
                    )!.keys()
                ).sort()
            } else {
                this.classes.value = []
            }
        })
        effect(() => {
            if (this.selectedCategory.value !== null
                && this.selectedClass.value !== null) {
                this.protocols.value = Array.from(
                    codefile.categories.get(
                        this.categories.at(this.selectedCategory.value)!
                    )!.get(
                        this.classes.at(this.selectedClass.value)!
                    )!.protocols[this.selectedType.value!]!.keys()
                ).sort()
            } else {
                this.protocols.value = []
            }
        })
        effect(() => {
            if (this.selectedCategory.value !== null
                && this.selectedClass.value !== null
                && this.selectedProtocol.value !== null) {
                this.methods.value = Array.from(
                    codefile.categories.get(
                        this.categories.at(this.selectedCategory.value)!
                    )!.get(
                        this.classes.at(this.selectedClass.value)!
                    )!.protocols[this.selectedType.value!]!.get(
                        this.protocols.at(this.selectedProtocol.value)!
                    )!.methods.keys()
                ).sort()
            } else {
                this.methods.value = []
            }
        })
        effect(() => {
            if (this.selectedCategory.value === null) {
                return
            }
            if (this.selectedClass.value === null) {
                this.code.value = `NameOfSuperclass subclass: #NameOfClass\n\tinstanceVariableNames: 'instVarName1 instVarName2'\n\tclassVariableNames: 'ClassVarName1 ClassVarName2'\n\tpoolDictionaries: ''\n\tcategory: '${this.categories.at(this.selectedCategory.value)}'`
                return
            }
            if (this.selectedProtocol.value === null) {
                const clazz = codefile.categories.get(
                    this.categories.at(this.selectedCategory.value)!
                )!.get(
                    this.classes.at(this.selectedClass.value)!
                )!
                if (this.selectedType.value == ST_ProtocolType.INSTANCE) {
                    this.code.value = codefile.getCode(
                        clazz.offsetInstance
                    )
                } else {
                    this.code.value = codefile.getCode(
                        clazz.offsetClass
                    )
                }
                return
            }
            if (this.selectedMethod.value === null) {
                this.code.value = `message selector and argument names\n\t"comment stating purpose of message"\n\n\t| temporary variable names |\n\tstatements`
                return
            }

            this.code.value = codefile.getCode(
                codefile.categories.get(
                    this.categories.at(this.selectedCategory.value)!
                )!.get(
                    this.classes.at(this.selectedClass.value)!
                )!.protocols[this.selectedType.value!]!.get(
                    this.protocols.at(this.selectedProtocol.value)!
                )!.methods.get(
                    this.methods.at(this.selectedMethod.value)!
                )!.offset
            )
        })

        // clear dependant selection
        this.selectedCategory.signal.add(() => { this.selectedClass.value = null })
        this.selectedClass.signal.add(() => { this.selectedProtocol.value = null })
        this.selectedType.signal.add(() => { this.selectedProtocol.value = null })
        this.selectedProtocol.signal.add(() => { this.selectedMethod.value = null })
    }
}
