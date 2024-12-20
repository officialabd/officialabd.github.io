import { Circle } from "./Circle";

class CirclesData {
    private circles: Circle[] = [];
    private counter = 0;

    addCircle(id: any, cx: number, cy: number, r: number, fill: string) {
        this.circles.push(
            new Circle(id + "-" + this.counter, cx, cy, r, fill)
        );
        this.counter++;
    }

    updateCircles(startX_X_value: number, transitionX: number, cap: number, transitionY: number, newR: number) {
        this.circles.forEach(circle => {
            circle.update(startX_X_value, transitionX, cap, transitionY, newR)
        })
    }

    getCircles() {
        return this.circles
    }
}

export { CirclesData };

