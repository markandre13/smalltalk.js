import type { ST_Number } from "./ST_Number"

/*
BitBlt subclass: #Pen
    instanceVariableNames: 'frame location direction penDown'
    classVariableNames: ''
    poolDictionaries: ''
    category: 'Graphics-Primitives'

new
    | quill |
    quill := super new.
    quill destForm: Display.
    quill frame: Display boundingBox.
    quill sourceOrigin: 0@0.
    quill mask: Form black.
    quill defaultNib: 1.
    quill combinationRule: Form paint.
    quill down.
    quill home.
    quill north.
    ^ quill
*/
export class ST_Point {
    __x: ST_Number
    __y: ST_Number
    constructor(x: ST_Number, y: ST_Number) {
        this.__x = x
        this.__y = y
    }
    /**
     * Answers a new Point that is the product of the receiver and scale (which is a
     * Point or Number)
     */
    _mul(a: ST_Number) { return new ST_Point(this.__x._mul(a), this.__y._mul(a)) }
    /**
     * Answers a new Point that is the sum of the receiver and delta (which is a Point
     * or Number)
     */
    _add(delta: ST_Point) { return new ST_Point(this.__x._add(delta.__x), this.__y._add(delta.__y)) }
    asPoint() { return this }
    x() { return this.__x }
    y() { return this.__y }
}
