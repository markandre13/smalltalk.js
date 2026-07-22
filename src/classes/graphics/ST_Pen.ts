import { Canvas } from "../../viewkit/Canvas"
import { ST_Number } from "../numeric/ST_Number"
import { ST_Point } from "./ST_Point"

export class ST_Pen {
    location!: ST_Point
    direction!: ST_Number
    penDown = true;

    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    static _new() {
        return new ST_Pen()
    }
    constructor() {
        this.canvas = Canvas.singleton.canvas
        this.ctx = Canvas.singleton.ctx
        // this.down()
        this._home()
        this._north()
    }
    _foo() {
        this.ctx.fillStyle = "green"
        this.ctx.fillRect(10, 10, 150, 100)
    }
    /**
     * Place the receiver at the center of its frame.
     */
    _home() {
        this.location = new ST_Point(
            new ST_Number(this.canvas.width / 2),
            new ST_Number(this.canvas.height / 2)
        )
    }
    /**
     * Set the receiver's direction to facing towards the top of the display screen.
     */
    _north() { this.direction = new ST_Number(270) }
    _turn_(degrees: ST_Number) {
        this.direction = this.direction.$add(degrees).$mod(new ST_Number(360))
    }
    /**
     * Move the receiver in its current direction a number of bits equal to
     * the argument, distance.  If the pen is down, a line will be drawn using
     * the receiver's form source as the thape of the drawing brush.
     */
    _go_(distance: ST_Number) {
        let dir
        dir = this.direction._degreesToRadians()
        dir = new ST_Point(dir._cos(), dir._sin())
        dir.$mul(distance)

        this._goto_(dir.$mul(distance).$add(this.location))
    }
    /**
     * Move the receiver to position aPoint.  If the pen is down, a line will be drawn
     * from the current position to the new one using the receiver's form source as the
     * shape of the drawing brush.  The receiver's set direction does not change.
     */
    _goto_(aPoint: ST_Point) {
        // console.log("Pen.goto()")
        let old = this.location
        this.location = aPoint
        if (this.penDown) {
            // console.log(`draw (${old.x.value}, ${old.y.value}) - (${this.location.x.value}, ${this.location.y.value})`)
            this.ctx.lineWidth = 0.1
            this.ctx.moveTo(old.x.value, old.y.value)
            this.ctx.lineTo(this.location.x.value, this.location.y.value)
            this.ctx.stroke()
        }
    }
}
