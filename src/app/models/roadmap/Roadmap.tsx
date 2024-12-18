import { DetailedListItem } from "../Item";
import { RoadModel } from "./Road";

class RoadmapModel {
    readonly STARTING_POINT: number = 50
    private id: any;
    private roads: Array<RoadModel>;
    private currentTotalLength: number = this.STARTING_POINT;
    private counter: number = 0
    private firstStartDate: Date | undefined;

    constructor(id: any) {
        this.id = id + "-Roadmap"
        this.roads = new Array<RoadModel>();
    }

    addMainRoad(firstStartDate: Date, color: string) {
        if (this.firstStartDate == undefined)
            this.firstStartDate = firstStartDate;

        const road = new RoadModel(this.id + "-" + this.counter, color);
        road.setMainItem(this.firstStartDate);

        this.roads.push(road);

        this.counter++;
    }

    addRoad(item: DetailedListItem, firstStartDate: Date, margin: number, color: string) {
        if (this.firstStartDate == undefined)
            this.firstStartDate = firstStartDate;

        const road = new RoadModel(this.id + "-" + this.counter, color);
        road.setItem(item, this.firstStartDate, margin, this.currentTotalLength, this.counter);

        this.roads.push(road);

        this.counter++;
    }

    getRoads() {
        return this.roads;
    }

}

export { RoadmapModel };

