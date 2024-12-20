
class Circle {
    private id: any;
    private cx: number;
    private cy: number;
    private r: number;
    private cx_c?: number;
    private cy_c?: number;
    private r_c?: number;
    private fill: string;

    constructor(id: any, cx: number, cy: number, r: number, fill: string) {
        this.id = id + "-circle";
        this.cx = cx;
        this.cy = cy;
        this.r = r;
        this.fill = fill;
        this.update(20, 500, 20, 0, r)
        this.r_c = r;
    }

    update(startX_X_value: number, transitionX: number, cap: number, transitionY: number, newR: number) {
        if (this.cx == 0) cap = 0;
        this.cx_c = this.cx * startX_X_value + transitionX + cap
        this.cy_c = this.cy + transitionY;
        // this.r_c = newR
    }

    getId() {
        return this.id;
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

    getCx_c(): number | undefined {
        return this.cx_c;
    }

    getCy_c(): number | undefined {
        return this.cy_c;
    }

    getR_c(): number | undefined {
        return this.r_c;
    }

    getFill(): string {
        return this.fill;
    }

}

export { Circle };

