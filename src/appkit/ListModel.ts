import { ValueModel } from "./ValueModel";

export class ListModel extends ValueModel<string[]> {
    constructor(value: string[] = []) {
        super(value)
    }
    [Symbol.iterator]() {
        return this.value[Symbol.iterator]();
    }
    at(index: number): string | undefined {
        return this.value[index];
    }
    get length(): number {
        return this.value.length
    }
}
