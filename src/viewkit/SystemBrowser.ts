import { CodeFile } from "../codefile";
import { CodeView } from "./CodeView";
import { ListModel } from "../appkit/ListModel";
import { ListView } from "./ListView";
import { NumberModel } from "../appkit/NumberModel";
import { effect } from "../reactivity/computed";
import { View } from "./View";

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
        this.appendChild(methodView);

        const codeView = new CodeView()
        codeView.title = "code"
        codeView.classList.add("system-browser-code")
        this.appendChild(codeView);

        const filename = "files/Smalltalk-80.sources"
        fetch(filename)
            .then((response) => {
                response.bytes().then((bytes) => {
                    const codefile = new CodeFile(filename, bytes)

                    categoryView.list = makeList(() => codefile.categories.keys())
                    categoryView.selection = new NumberModel(0)

                    classView.list = makeList(() => codefile
                        .categories.get(categoryView.value!)!.keys())
                    classView.selection = new NumberModel(0)

                    classTypeView.list = makeList(() => ["instance", "class"])
                    classTypeView.selection = new NumberModel(0)

                    protocolView.list = makeList(() => codefile
                        .categories.get(categoryView.value!)!
                        .get(classView.value!)!
                        .protocols.keys());
                    protocolView.selection = new NumberModel(0)

                    methodView.list = makeList(() => codefile
                        .categories.get(categoryView.value!)!
                        .get(classView.value!)!
                        .protocols.get(protocolView.value!)!
                        .methods.keys())
                    methodView.selection = new NumberModel(0)

                    effect(() => {
                        const method = codefile
                            .categories.get(categoryView.value!)!
                            .get(classView.value!)!
                            .protocols.get(protocolView.value!)!
                            .methods.get(methodView.value!)
                        codeView.element.innerHTML = codefile.getCode(method!)
                    });

                }).catch((e) => {
                    console.error(e)
                });
            }).catch((e) => {
                console.error(e)
            })
    }
}

function makeList(fn: () => MapIterator<string> | Array<string>) {
    const model = new ListModel([]);
    effect(() => {
        const iterator = fn();
        if (iterator instanceof Array) {
            model.value = iterator;
        } else {
            model.value = Array.from(iterator).sort()
        }
    })

    return model
}