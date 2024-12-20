import Utilities from "@/app/utilities/BasicUtil";
import { DetailedListItem } from "../Item";
import { RoadModel } from "./Road";

class RoadmapModel {
    private id: any;
    private roads: Array<RoadModel>;
    private counter: number = 0
    private startDate: Date | undefined;
    private withMainRoad?: boolean = false;
    private mainRoadColor?: string = "white";
    private items: Array<DetailedListItem>;

    colors = ["pink", "lightblue", "red", "orange", "green", "cyan", "blue", "yellow", "purple", "brown"]

    constructor(id: any, items: Array<DetailedListItem>, withMainRoad?: boolean, mainRoadColor?: string) {
        this.id = id + "-Roadmap"
        this.items = items;
        this.withMainRoad = withMainRoad;
        this.mainRoadColor = mainRoadColor;
        this.roads = new Array<RoadModel>();

        this.initialize();
    }

    initialize() {
        this.findStartDate();

        this.addMainRoad();

        this.addRoads();
    }

    private findStartDate() {
        this.items.forEach(item => {
            const temp = Utilities.toDate(item.getStartDate()!);
            if (this.startDate == undefined || temp.getTime() < this.startDate.getTime())
                this.startDate = temp;
        })
    }

    private addMainRoad() {
        if (this.withMainRoad) {
            this.addRoad(0, true, this.mainRoadColor!);
        }
    }

    findDiff(end: string, start: string) {
        let endDate = Utilities.toDate(end)
        let startDate = Utilities.toDate(start)

        return endDate.getTime() - startDate.getTime();

    }

    private addRoads() {
        const sortedItems = [...this.items].sort((a, b) => {
            const startA = Utilities.toDate(a.getStartDate()!).getTime();
            const startB = Utilities.toDate(b.getStartDate()!).getTime();

            // Sort by earliest start date first
            if (startA !== startB) {
                return startA - startB;
            }

            // If start dates are the same, sort by longest duration
            const durationA = this.findDiff(a.getEndDate()!, a.getStartDate()!);
            const durationB = this.findDiff(b.getEndDate()!, b.getStartDate()!);

            return durationB - durationA;
        });

        sortedItems.map((item, i) => {
            let assignedIndex = 0;
            let addToStartY = 0;
            let original = Utilities.calculateDifferenceAsLength(Utilities.toDate(item.getStartDate()!), this.startDate!);
            let itemStartY = Utilities.calculateDifferenceAsLength(Utilities.toDate(item.getStartDate()!), this.startDate!);
            if (i == 4) {
                console.log("Started - - -- - -");

                console.log(addToStartY);
                console.log(itemStartY);
            }
            for (const road of this.roads) {
                if (road.isMainRoad()) continue;
                if (i == 4) {
                    console.log(this.colors[i] + ' ---------------- checking with ' + road.getColor());
                    console.log(road.getColor() + " startY: " + road.getCardData().getY()!);

                }

                const isOverlapping = this.areOverlapping(
                    Utilities.toDate(item.getStartDate()!),
                    Utilities.toDate(item.getEndDate()!),
                    road.getStartDate()!,
                    road.getEndDate()!
                )

                if (isOverlapping && assignedIndex == (road.getIndex() - 1)) assignedIndex++;

                // if (isOverlapping) {
                const [willCardsOverlap, diff] = this.willCardsOverlap(
                    road.getStartDate()!,
                    Utilities.toDate(item.getStartDate()!),
                    itemStartY,
                    road.getCardData().getY()!,
                    200
                )

                if (willCardsOverlap) {
                    if (diff >= 0)
                        addToStartY = (200 - diff + 20)
                    else
                        addToStartY = (200 + Math.abs(diff) + 20)
                    itemStartY += addToStartY;
                }
                // }

                if (i == 4) {
                    console.log('----');

                    console.log("addToStartY: " + addToStartY);
                    console.log("itemStartY: " + itemStartY);
                }
            }

            this.addRoad(assignedIndex + 1, false, this.colors[i], itemStartY - original, item);
        });
        console.log(this.roads);
    }

    private areOverlapping(a_startDate: Date, a_endDate: Date, b_startDate: Date, b_endDate: Date) {
        return Utilities.isBounded(a_startDate, b_startDate, b_endDate) ||
            Utilities.isBounded(a_endDate, b_startDate, b_endDate) ||
            Utilities.isBounded(b_startDate, a_startDate, a_endDate) ||
            Utilities.isBounded(b_endDate, a_startDate, a_endDate)
    }

    private willCardsOverlap(a_startDate: Date, b_startDate: Date, bStartY: number, aStartY: number, cardHeight: number): [boolean, number] {
        // const diff = Utilities.calculateDifferenceAsLength(b_startDate, a_startDate);
        // const willOverlap = (bStartY >= aStartY && bStartY <= (aStartY + cardHeight + 20)) || bStartY <= aStartY
        const willOverlap = bStartY <= (aStartY + cardHeight + 20)
        const diff = bStartY - aStartY

        //diff <= (cardHeight + 20)
        return [willOverlap, diff]
    }

    private addRoad(index: number, isMain: boolean = false, color: string = "white", updatedStartY?: number | undefined, item?: DetailedListItem) {
        let road = new RoadModel(this.id + "-" + this.counter, this.startDate!, index, color, isMain, item);
        if (updatedStartY) road.getCardData().setY(updatedStartY);

        this.roads.push(road);

        this.counter++;
    }

    getRoads() {
        return this.roads;
    }

    getId() {
        return this.id;
    }

}

export { RoadmapModel };

