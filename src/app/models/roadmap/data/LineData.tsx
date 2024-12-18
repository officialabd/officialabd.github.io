class LineData {
    private id: any;
    private lineData: string = "";
    private startPointX: number;
    private startPointY: number;
    private endPointX!: number;
    private endPointY!: number;

    constructor(id: any, startPointX: number, startPointY: number) {
        this.id = id;
        this.moveTo(startPointX, startPointY);
        this.startPointX = startPointX;
        this.startPointY = startPointY;
    }

    getId() {
        return this.id;
    }

    /**
     * Appends a string to the line data, ensuring each new command is separated by a new line.
     * @param str - The string to append to the line data.
     */
    private appendStringToLineData(str: string) {
        if (this.lineData.length !== 0) {
            this.lineData += "\n";  // Correctly appending a new line
        }
        this.lineData += str;  // Append the new path data
    }

    /**
     * Moves the "pen" or "current position" to the point (x, y) without drawing anything.
     * It's used to start a new sub-path or to move to a specific location in the SVG path.
     * 
     * Command: M x, y
     * 
     * @param startPointX - The x-coordinate to move to.
     * @param startPointY - The y-coordinate to move to.
     */
    moveTo(startPointX: number, startPointY: number) {
        this.appendStringToLineData(`M ${startPointX} ${startPointY}`);
        return this;
    }

    /**
     * Draws a straight line from the current position to a new position (x, y).
     * 
     * Command: L x, y
     * 
     * @param endPointX - The x-coordinate to draw the line to.
     * @param endPointY - The y-coordinate to draw the line to.
     */
    addStraightLine(endPointX: number, endPointY: number) {
        this.appendStringToLineData(`L ${endPointX} ${endPointY}`);
        return this;
    }

    /**
     * Draws a horizontal line from the current position to a new x-coordinate, keeping the y-coordinate the same.
     * 
     * Command: H x
     * 
     * @param endPointX - The x-coordinate to draw the horizontal line to.
     */
    addHorizontalLine(endPointX: number) {
        this.appendStringToLineData(`H ${endPointX}`);
        return this;
    }

    /**
     * Draws a vertical line from the current position to a new y-coordinate, keeping the x-coordinate the same.
     * 
     * Command: V y
     * 
     * @param endPointY - The y-coordinate to draw the vertical line to.
     */
    addVerticalLine(endPointY: number) {
        this.appendStringToLineData(`V ${endPointY}`);
        this.endPointX = this.startPointX;
        this.endPointY = endPointY;
        return this;
    }

    /**
     * Draws a quadratic Bézier curve from the current position, using a control point to determine the curve.
     * 
     * Command: Q controlX, controlY, endX, endY
     * 
     * @param controlPointX - The x-coordinate of the control point.
     * @param controlPointY - The y-coordinate of the control point.
     * @param endPointX - The x-coordinate of the curve's end point.
     * @param endPointY - The y-coordinate of the curve's end point.
     */
    addQuadraticBezierCurve(
        controlPointX: number,
        controlPointY: number,
        endPointX: number,
        endPointY: number
    ) {
        this.appendStringToLineData(`Q ${controlPointX} ${controlPointY} ${endPointX} ${endPointY}`);
        return this;
    }

    /**
     * Draws a cubic Bézier curve from the current position, using two control points to determine the curve.
     * 
     * Command: C control1X, control1Y, control2X, control2Y, endX, endY
     * 
     * @param controlPoint1X - The x-coordinate of the first control point.
     * @param controlPoint1Y - The y-coordinate of the first control point.
     * @param controlPoint2X - The x-coordinate of the second control point.
     * @param controlPoint2Y - The y-coordinate of the second control point.
     * @param endPointX - The x-coordinate of the curve's end point.
     * @param endPointY - The y-coordinate of the curve's end point.
     */
    addCubicBezierCurve(
        controlPoint1X: number,
        controlPoint1Y: number,
        controlPoint2X: number,
        controlPoint2Y: number,
        endPointX: number,
        endPointY: number
    ) {
        this.appendStringToLineData(`C ${controlPoint1X} ${controlPoint1Y} ${controlPoint2X} ${controlPoint2Y} ${endPointX} ${endPointY}`);
        return this;
    }

    /**
     * Draws an elliptical arc from the current position to a new point.
     * 
     * Command: A rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, endX, endY
     * 
     * @param rx - The x-axis radius of the arc.
     * @param ry - The y-axis radius of the arc.
     * @param xAxisRotation - The rotation of the ellipse along the x-axis.
     * @param largeArcFlag - Specifies whether the arc should be greater than 180 degrees.
     * @param sweepFlag - Determines the direction of the arc.
     * @param endPointX - The x-coordinate of the arc's end point.
     * @param endPointY - The y-coordinate of the arc's end point.
     */
    addArc(
        rx: number,
        ry: number,
        xAxisRotation: number,
        largeArcFlag: number,
        sweepFlag: number,
        endPointX: number,
        endPointY: number
    ) {
        this.appendStringToLineData(`A ${rx} ${ry} ${xAxisRotation} ${largeArcFlag} ${sweepFlag} ${endPointX} ${endPointY}`);
        return this;
    }

    /**
     * Closes the current sub-path by drawing a straight line back to the starting point.
     * 
     * Command: Z
     */
    closePath() {
        this.appendStringToLineData(`Z`);
        return this;
    }

    /**
     * Gets the generated path data.
     * 
     * @returns The path data as a string.
     */
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

