import { CodeFile } from "../compiler/codefile"
import { CodeView } from "./CodeView"
import { ListView } from "./ListView"
import { View } from "./View"
import { SystemBrowserModel } from "../appkit/SystemBrowserModel"

// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃                 System Browser                ┃
// ┣━━━━━━━━━━━┳━━━━━━━━━━━┳━━━━━━━━━━━┳━━━━━━━━━━━┫
// ┃Categories ┃ Classes   ┃ Protocols ┃ Methods   ┃
// ┃           ┃           ┃           ┃           ┃
// ┃           ┃           ┃           ┃           ┃
// ┃           ┃           ┃           ┃           ┃
// ┃           ┃           ┃           ┃           ┃
// ┃           ┣━━━━━━━━━━━┫           ┃           ┃
// ┃           ┃◉ instance ┃           ┃           ┃
// ┃           ┃◯ class    ┃           ┃           ┃
// ┣━━━━━━━━━━━┻━━━━━━━━━━━┻━━━━━━━━━━━┻━━━━━━━━━━━┫
// ┃ CodeView                                      ┃
// ┃                                               ┃
// ┃                                               ┃
// ┃                                               ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
// do 2 different System Browsers
// * classic
// * compact with popup menus:
// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃                 System Browser                ┃
// ┣━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃Categories ┃ CodeView                          ┃
// ┣━━━━━━━━━━━┫                                   ┃
// ┃Classes    ┃                                   ┃
// ┣━━━━━━━━━━━┫                                   ┃
// ┃class/inst ┃                                   ┃
// ┣━━━━━━━━━━━┫                                   ┃
// ┃Protocols  ┃                                   ┃
// ┣━━━━━━━━━━━┫                                   ┃
// ┃Methods    ┃                                   ┃
// ┗━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
export class SystemBrowser extends View {
    constructor() {
        super("div")
        this.element.className = "system-browser"

        const categoryView = new ListView()
        categoryView.title = "categories of classes"
        categoryView.classList.add("system-browser-categories")
        this.appendChild(categoryView)

        const classView = new ListView()
        classView.title = "classes"
        classView.classList.add("system-browser-classes")
        this.appendChild(classView)

        const classTypeView = new ListView()
        classTypeView.title = "classes"
        classTypeView.classList.add("system-browser-class-types")
        this.appendChild(classTypeView)

        const protocolView = new ListView()
        protocolView.title = "categories of methods (aka. protocols)"
        protocolView.classList.add("system-browser-protocols")
        this.appendChild(protocolView)

        const methodView = new ListView()
        methodView.title = "methods"
        methodView.classList.add("system-browser-methods")
        this.appendChild(methodView)

        const codeView = new CodeView()
        codeView.title = "code"
        codeView.classList.add("system-browser-code")
        this.appendChild(codeView)

        const filename = "files/Smalltalk-80.sources"
        fetch(filename)
            .then((response) => {
                response.bytes().then((bytes) => {
                    const codefile = new CodeFile(filename, bytes)
                    const model = new SystemBrowserModel(codefile)

                    categoryView.list = model.categories
                    categoryView.selection = model.selectedCategory

                    classView.list = model.classes
                    classView.selection = model.selectedClass

                    classTypeView.list = model.type
                    classTypeView.selection = model.selectedType

                    protocolView.list = model.protocols
                    protocolView.selection = model.selectedProtocol

                    methodView.list = model.methods
                    methodView.selection = model.selectedMethod

                    codeView.model = model.code

                }).catch((e) => {
                    console.error(e)
                })
            }).catch((e) => {
                console.error(e)
            })
    }
}
