import { Circle } from './data/Circle';
import { CirclesData } from './data/CirclesData';
import { LineData } from './data/LineData';
import { Text } from './data/Text';
import { TextsData } from './data/TextsData';

class Road {
    private id: any;
    private lineData: LineData;
    private circlesData: CirclesData;
    private textsData: TextsData;

    constructor(id: any, lineData: LineData) {
        this.id = id;
        this.lineData = lineData;
        this.circlesData = new CirclesData(); // Initialize CircleData
        this.textsData = new TextsData(); // Initialize TextsData
    }

    getId() {
        return this.id;
    }

    // Add a circle to the road
    addCircle(circle: Circle) {
        this.circlesData.addCircle(circle);
    }

    // Add text to the road
    addText(text: Text) {
        this.textsData.addText(text);
    }

    // Get the line data from the road
    getLineData() {
        return this.lineData.getPathData();
    }

    // Get all circles data added to the road
    getCirclesData() {
        return this.circlesData.getCirclesData();
    }

    // Get all text data added to the road
    getTextData() {
        return this.textsData.getTextData();
    }

    // Get full SVG data for the road (line + circles + text)
    getFullRoadData() {
        const circlesData = this.getCirclesData();
        const textsData = this.getTextData();
        return `${this.getLineData()} ${circlesData} ${textsData}`;
    }
}

export { Road };

