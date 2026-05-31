export class Canvas {
    static singleton: Canvas

    div: HTMLDivElement
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    
    constructor() {
        Canvas.singleton = this
        this.invalidate = this.invalidate.bind(this)
        this.update = this.update.bind(this)

        this.div = document.createElement("div")
        this.canvas = document.createElement("canvas")
        // this.canvas.style.backgroundColor = '#ff8800'
        const observer = new ResizeObserver(this.invalidate)
        observer.observe(this.div)
        this.div.appendChild(this.canvas)

        this.ctx = this.canvas.getContext("2d")!
    }

    private _invalidated = false;

    invalidate() {
        if (this._invalidated) {
            return
        }
        this._invalidated = true
        requestAnimationFrame(this.update)
    }

    update() {
        const r = this.div.getBoundingClientRect()

        this.canvas.style.width = `${r.width}px`
        this.canvas.style.height = `${r.height}px`

        const devicePixelRatio = window.devicePixelRatio
        const pixelWidth = this.div.clientWidth * devicePixelRatio
        const pixelHeight = this.div.clientHeight * devicePixelRatio
        if (this.canvas.width !== pixelWidth || this.canvas.height !== pixelHeight) {
            this.canvas.width = pixelWidth
            this.canvas.height = pixelHeight
        }
        this._invalidated = false
    }
}
