import { Circle } from "./Circle";

class CirclesData {
    private circles: Circle[] = [];

    // Add a circle to the CircleData
    addCircle(circle: Circle) {
        this.circles.push(circle);
    }

    // Get all circle data as a string for SVG output
    getCirclesData() {
        return this.circles.map(circle => circle.getCircleData()).join(' ');
    }
}

export { CirclesData };

