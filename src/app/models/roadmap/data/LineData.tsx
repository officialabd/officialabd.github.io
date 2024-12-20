
class LineData {
    private id: any;
    private lineData: string = "";
    private startPointX: number;
    private startPointY: number;
    private endPointX: number;
    private endPointY: number;

    constructor(id: any, startPointX: number, startPointY: number, endPointX: number, endPointY: number) {
        this.id = id + "-Line";
        this.startPointX = startPointX;
        this.startPointY = startPointY;
        this.endPointX = endPointX;
        this.endPointY = endPointY;

        this.update(20, 500, 20, 0);
    }

    private appendStringToLineData(str: string) {
        if (this.lineData.length !== 0) {
            this.lineData += "\n";
        }
        this.lineData += str;
    }

    private moveTo(startPointX: number, startPointY: number) {
        this.appendStringToLineData(`M ${startPointX} ${startPointY}`);
        return this;
    }

    private addVerticalLine(endPointY: number) {
        this.appendStringToLineData(`V ${endPointY}`);
        return this;
    }

    update(startX_X_value: number, transitionX: number, cap: number, transitionY: number) {
        this.lineData = "";
        if (this.startPointX == 0) cap = 0;
        if (this.startPointX < 0) cap = cap * -1;
        this.moveTo(this.startPointX * startX_X_value + transitionX + cap, this.startPointY + transitionY);
        this.addVerticalLine(this.endPointY + transitionY);

        return this.getPathData();
    }

    getId() {
        return this.id;
    }

    getPathData(): string {
        return this.lineData.trim();
    }

    getStartPointX(): number {
        return this.startPointX;
    }

    getStartPointY(): number {
        return this.startPointY;
    }

    getEndPointX(): number {
        return this.endPointX;
    }

    getEndPointY(): number {
        return this.endPointY;
    }
}

export { LineData };

