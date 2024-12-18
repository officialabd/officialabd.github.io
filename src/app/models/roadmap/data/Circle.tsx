class Circle {
    private id: any;
    private cx: number;  // Center X-coordinate
    private cy: number;  // Center Y-coordinate
    private r: number;   // Radius of the circle
    private fill: string; // Fill color of the circle

    constructor(id: any, cx: number, cy: number, r: number, fill: string) {
        this.id = id;
        this.cx = cx;
        this.cy = cy;
        this.r = r;
        this.fill = fill;
    }

    getId() {
        return this.id;
    }

    getCircleData() {
        return `cx="${this.cx}" cy="${this.cy}" r="${this.r}" fill="${this.fill}"`;
    }

    setCircleAttributes(cx: number, cy: number, r: number, fill: string) {
        this.cx = cx;
        this.cy = cy;
        this.r = r;
        this.fill = fill;
    }

    getCx(): number {
        return this.cx;
    }

    getCy(): number {
        return this.cy;
    }

    getR(): number {
        return this.r;
    }

    getFill(): string {
        return this.fill;
    }

}

export { Circle };

