import { Circle } from "./Circle";

class CirclesData {
    private circles: Circle[] = [];

    // Add a circle to the CircleData
    addCircle(id: any, cx: number, cy: number, r: number, fill: string) {
        this.circles.push(
            new Circle(id, cx, cy, r, fill)
        );
    }

    // Get all circle data as a string for SVG output
    getCirclesData() {
        return this.circles.map(circle => circle.getCircleData()).join(' ');
    }

    getCircles() {
        return this.circles
    }
}

export { CirclesData };

