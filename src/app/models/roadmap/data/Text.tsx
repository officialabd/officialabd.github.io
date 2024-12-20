
class Text {
    private id: any;
    private x: number;
    private y: number;
    private x_c?: number;
    private y_c?: number;
    private textContent: string;
    private fontSize: number;
    private fill: string;

    constructor(id: any, x: number, y: number, textContent: string, fontSize: number, fill: string) {
        this.id = id + "-Text";
        this.x = x;
        this.y = y;
        this.textContent = textContent;
        this.fontSize = fontSize;
        this.fill = fill;

        this.update(20, 500, 20, 0)
    }

    update(startX_X_value: number, transitionX: number, cap: number, transitionY: number) {
        if (this.x == 0) cap = 0;
        if (this.x < 0) cap = cap * -1;
        this.x_c = this.x * startX_X_value + transitionX + cap
        this.y_c = this.y + transitionY;
    }

    getId() {
        return this.id;
    }

    getX(): number {
        return this.x;
    }

    getY(): number {
        return this.y;
    }

    getX_c(): number | undefined {
        return this.x_c;
    }

    getY_c(): number | undefined {
        return this.y_c;
    }

    getTextContent(): string {
        return this.textContent;
    }

    getFontSize(): number {
        return this.fontSize;
    }

    getFill(): string {
        return this.fill;
    }

}

export { Text };

