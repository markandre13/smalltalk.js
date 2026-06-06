import { ValueModel } from "./ValueModel";

export class NumberModel extends ValueModel<number | null> {
    constructor(value: number | null = null) {
        super(value)
    }
 }
