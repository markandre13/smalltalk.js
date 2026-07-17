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
    x: ST_Number
    y: ST_Number
    constructor(x: ST_Number, y: ST_Number) {
        this.x = x
        this.y = y
    }
    /**
     * Answers a new Point that is the product of the receiver and scale (which is a
     * Point or Number)
     */
    $mul(a: ST_Number) { return new ST_Point(this.x.$mul(a), this.y.$mul(a)) }
    /**
     * Answers a new Point that is the sum of the receiver and delta (which is a Point
     * or Number)
     */
    $add(delta: ST_Point) { return new ST_Point(this.x.$add(delta.x), this.y.$add(delta.y)) }
    _asPoint() { return this }
    _x() { return this._x }
    _y() { return this._y }
}
