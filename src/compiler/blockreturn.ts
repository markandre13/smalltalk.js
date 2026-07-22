/**
 * value wrapper to be thrown by return statements within closures/blocks.
 * 
 * in Smalltalk a return statement inside a closure/block does not just leave
 * the closure/block, but also the method in which it is called.
 * 
 * this is needed to support code like like
 * ```
 * someExpression ifTrue: [^value].
 * ```
 * 
 * the simple way to map this to Javascript is use 'throw' as return inside of
 * blocks and surround each method with a suitable try-catch.
 * 
 * the other way is to let blocks return objects which either contain a
 * return value or a value, and then in the caller return the return value
 * or use the value as part of the surrounding expression.
 * and since 'return' is a statement, it can't be mixed with expressions,
 * 
 * hence instead of compiling the javascript expression
 * 
 * ```
 * v := obj a b c d.
 * ```
 * to
 * ```
 * v := obj.a().b().c().d();
 * ```
 * we would now need to compile it to something like
 * ```
 *   let _r;
 *   _r=obj.a();if("r" in _r) return _r;
 *   _r=_r.b();if("r" in _r) return _r;
 *   _r=_r.c();if("r" in _r) return _r;
 *   _r=_r.d();if("r" in _r) return _r;
 *   v = _r;
 * ```
 * 
 * so i choose the simple way.
 * 
 * see also: https://wiki.c2.com/?SmalltalkBlockReturn
  */
export class BlockReturn {
    value: any
    constructor(value: any) {
        this.value = value
    }
}