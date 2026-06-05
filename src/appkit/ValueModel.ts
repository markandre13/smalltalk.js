import { produceValue } from "../reactivity/computed";
import { Signal } from "../reactivity/signal";

export class ValueModel<V> {
    readonly signal = new Signal();
    private _value: V;
    constructor(value: V) {
        // super()
        this._value = value;
    }

    set value(value: V) {
        if (this._value === value) return;
        this._value = value;
        this.signal.emit();
    }
    get value(): V {
        produceValue(this.signal);
        return this._value;
    }
}
