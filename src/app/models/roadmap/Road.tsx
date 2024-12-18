import staticData from '@/app/staticData';
import { DetailedListItem } from '../Item';
import { CirclesData } from './data/CirclesData';
import { LineData } from './data/LineData';
import { TextsData } from './data/TextsData';

class RoadModel {
    private id: any;
    private lineData!: LineData;
    private circlesData!: CirclesData;
    private textsData!: TextsData;
    private fill: string;

    constructor(id: any, fill: string) {
        this.id = id + "-road";
        this.fill = fill;
    }

    setMainItem(firstStartDate: Date) {
        const current = new Date();

        const roadLength: number = this.calculateDifferenceAsLength(current, firstStartDate);

        this.lineData = new LineData(this.id, 700, 50);
        this.lineData.addVerticalLine(50 + roadLength);

        this.circlesData = new CirclesData();
        this.textsData = new TextsData();

        this.addMainYears(firstStartDate, current, roadLength);
    }

    private addMainYears(firstStartDate: Date, currentDate: Date, roadLength: number) {
        const yearNums = currentDate.getFullYear() - firstStartDate.getFullYear() + 1

        for (let yearNo = 0; yearNo < yearNums; yearNo++) {
            const year = firstStartDate.getFullYear() + yearNo
            let tempDate = firstStartDate
            if (yearNo > 0) {
                tempDate = new Date(year, 0, 1);
            }
            let height = this.calculateDifferenceAsLength(tempDate, firstStartDate);
            this.circlesData.addCircle(
                this.id, 700, 50 + height,
                staticData.roadmap_utilities.CIRCLE_RADIUS * 3,
                this.fill
            )

            this.textsData.addText(this.id, 700, 50 + height, year + "", 16, this.fill);
        }

    }

    setItem(item: DetailedListItem, firstStartDate: Date, margin: number, currentRoadTotalLength: number, numberOfCurrentRoads: number) {
        const sd = new Date(item.getStartDate()!);
        let ed = new Date(item.getEndDate()!);

        if (item.getEndDate() == "Present") {
            ed = new Date();
        }

        if (item.getEndDate() == "" || item.getEndDate() == undefined) {
            ed = new Date(sd.getFullYear(), sd.getMonth(), 31);
        }

        const startPoint: number = this.calculateDifferenceAsLength(sd, firstStartDate);

        const roadLength: number = this.calculateDifferenceAsLength(ed, sd);

        this.lineData = new LineData(this.id, 700 + margin, 50 + startPoint);
        this.lineData.addVerticalLine(50 + startPoint + roadLength);

        this.circlesData = new CirclesData();
        this.circlesData.addCircle(
            this.id, 700 + margin, 50 + startPoint,
            staticData.roadmap_utilities.CIRCLE_RADIUS,
            this.fill
        )
    }

    calculateDifferenceAsLength(startDate: Date, endDate: Date) {
        const diffInMs: number = Math.abs(endDate.getTime() - startDate.getTime());
        const diffInDays: number = diffInMs / (1000 * 60 * 60 * 24);

        const length: number = Math.ceil(diffInDays * staticData.roadmap_utilities.DAY_ROAD_LENGTH);

        return length;
    }

    getId() {
        return this.id;
    }

    // Add a circle to the road
    addCircle(id: any, cx: number, cy: number, r: number, fill: string) {
        this.circlesData.addCircle(id, cx, cy, r, fill);
    }

    // Add text to the road
    // addText(text: Text) {
    //     this.textsData.addText(text);
    // }

    // Get the line data from the road
    getLineData() {
        return this.lineData.getPathData();
    }

    // Get all circles data added to the road
    getCirclesData() {
        return this.circlesData;
    }

    // Get all text data added to the road
    getTextData() {
        return this.textsData;
    }

    // Get full SVG data for the road (line + circles + text)
    getFullRoadData() {
        const circlesData = this.getCirclesData();
        const textsData = this.getTextData();
        return `${this.getLineData()} ${circlesData} ${textsData}`;
    }

    // Get the color of the road
    getColor() {
        return this.fill;
    }

}

export { RoadModel };

