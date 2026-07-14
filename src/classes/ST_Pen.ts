import { Canvas } from "../viewkit/Canvas"
import { ST_Number } from "./ST_Number"
import { ST_Point } from "./ST_Point"

export class ST_Pen {
    location!: ST_Point
    direction!: ST_Number
    penDown = true;

    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    static new() {
        return new ST_Pen()
    }
    constructor() {
        this.canvas = Canvas.singleton.canvas
        this.ctx = Canvas.singleton.ctx
        // this.down()
        this.home()
        this.north()
    }
    foo() {
        this.ctx.fillStyle = "green"
        this.ctx.fillRect(10, 10, 150, 100)
    }
    /**
     * Place the receiver at the center of its frame.
     */
    home() {
        this.location = new ST_Point(
            new ST_Number(this.canvas.width / 2),
            new ST_Number(this.canvas.height / 2)
        )
    }
    /**
     * Set the receiver's direction to facing towards the top of the display screen.
     */
    north() { this.direction = new ST_Number(270) }
    turn_(degrees: ST_Number) {
        this.direction = this.direction._add(degrees)._mod(new ST_Number(360))
    }
    /**
     * Move the receiver in its current direction a number of bits equal to
     * the argument, distance.  If the pen is down, a line will be drawn using
     * the receiver's form source as the thape of the drawing brush.
     */
    go_(distance: ST_Number) {
        let dir
        dir = this.direction.degreesToRadians()
        dir = new ST_Point(dir.cos(), dir.sin())
        dir._mul(distance)

        this.goto_(dir._mul(distance)._add(this.location))
    }
    /**
     * Move the receiver to position aPoint.  If the pen is down, a line will be drawn
     * from the current position to the new one using the receiver's form source as the
     * shape of the drawing brush.  The receiver's set direction does not change.
     */
    goto_(aPoint: ST_Point) {
        // console.log("Pen.goto()")
        let old = this.location
        this.location = aPoint
        if (this.penDown) {
            // console.log(`draw (${old.x.value}, ${old.y.value}) - (${this.location.x.value}, ${this.location.y.value})`)
            this.ctx.moveTo(old.__x.value, old.__y.value)
            this.ctx.lineTo(this.location.__x.value, this.location.__y.value)
            this.ctx.stroke()
        }
    }
}
