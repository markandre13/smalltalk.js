import { ValueModel } from "./ValueModel";

export class ListModel extends ValueModel<string[]> {
    [Symbol.iterator]() {
        return this.value[Symbol.iterator]();
    }
    at(index: number) {
        return this.value[index];
    }
}
