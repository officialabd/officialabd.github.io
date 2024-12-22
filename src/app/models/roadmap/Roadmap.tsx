import Utilities from "@/app/utilities/BasicUtil";
import { DetailedListItem } from "../Item";
import { RoadModel } from "./Road";
import { CardData } from "./data/CardData";
import { CardDataGroups } from "./data/CardDataGroups";

class RoadmapModel {
    private id: any;
    private roads: Array<RoadModel>;
    private counter: number = 0
    private startDate: Date | undefined;
    private withMainRoad?: boolean = false;
    private mainRoadColor?: string = "white";
    private items: Array<DetailedListItem>;
    private roadmapLength?: number;
    private groups: CardDataGroups;

    constructor(id: any, items: Array<DetailedListItem>, withMainRoad?: boolean, mainRoadColor?: string) {
        this.id = id + "-Roadmap"
        this.items = items;
        this.withMainRoad = withMainRoad;
        this.mainRoadColor = mainRoadColor;
        this.roads = new Array<RoadModel>();
        this.groups = new CardDataGroups();

        this.initialize();
    }

    initialize() {
        this.findStartDate();

        this.addRoads();

        this.addMainRoad();
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
        const left = this.items.filter(item => item.getTimeline()?.direction === 'left');
        const right = this.items.filter(item => item.getTimeline()?.direction === 'right');

        const sortedLeftItems = this.sortItems(left);
        const sortedRightItems = this.sortItems(right);

        this.mapRoads(sortedLeftItems, "left");
        this.mapRoads(sortedRightItems, "right");
    }

    mapRoads(items: Array<DetailedListItem>, direction: string) {
        items.map((item) => {
            let original = Utilities.calculateDifferenceAsLength(Utilities.toDate(item.getStartDate()!), this.startDate!);
            let initialItemStartY = Utilities.calculateDifferenceAsLength(Utilities.toDate(item.getStartDate()!), this.startDate!);

            let [assignedIndex, itemStartY] = this.setRoadIndex(item, initialItemStartY, direction);

            if (direction === "left") assignedIndex--;
            else assignedIndex++;

            if (item.getTimeline()?.group != undefined) {
                const cardData = new CardData(
                    this.id,
                    assignedIndex,
                    initialItemStartY,
                    item.getTimeline()?.color!,
                    item.getTimeline()?.direction!,
                    item,
                    item.getTimeline()?.group!,
                    item.getTimeline()?.isMain!
                );
                this.groups.addCardDataToGroup(cardData)
            }

            this.addRoad(assignedIndex, false, item.getTimeline()?.color, itemStartY - original, item);
        });
    }

    private setRoadIndex(item: DetailedListItem, itemStartY: number, direction: string) {
        let addToStartY = 0;
        let assignedIndex = 0;
        for (const road of this.roads) {
            if (road.isMainRoad() || road.getItem()?.getTimeline()?.direction != direction) continue;// ToDo: update to accomodate for the single column timeline

            const isOverlapping = this.areOverlapping(
                Utilities.toDate(item.getStartDate()!),
                Utilities.toDate(item.getEndDate()!),
                road.getStartDate()!,
                road.getEndDate()!
            )

            if (isOverlapping && assignedIndex == (road.getIndex() + (direction == "left" ? 1 : -1))) {
                if (direction === "left") assignedIndex--;
                else assignedIndex++;
            }
            if (road.getCardData() != undefined) {

                const [willCardsOverlap, diff] = this.willCardsOverlap(
                    itemStartY,
                    road.getCardData().getY()!,
                    150
                )

                if (willCardsOverlap) {
                    if (diff >= 0)
                        addToStartY = (150 - diff + 20)
                    else
                        addToStartY = (150 + Math.abs(diff) + 20)
                    itemStartY += addToStartY;
                }
            }
        }
        return [assignedIndex, itemStartY]
    }

    private sortItems(items: Array<DetailedListItem>) {
        const sortedItems = items.sort((a, b) => {
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
        return sortedItems;
    }

    private areOverlapping(a_startDate: Date, a_endDate: Date, b_startDate: Date, b_endDate: Date) {
        return Utilities.isBounded(a_startDate, b_startDate, b_endDate) ||
            Utilities.isBounded(a_endDate, b_startDate, b_endDate) ||
            Utilities.isBounded(b_startDate, a_startDate, a_endDate) ||
            Utilities.isBounded(b_endDate, a_startDate, a_endDate)
    }

    private willCardsOverlap(bStartY: number, aStartY: number, cardHeight: number): [boolean, number] {
        const willOverlap = bStartY <= (aStartY + cardHeight + 20)
        const diff = bStartY - aStartY

        return [willOverlap, diff]
    }

    private addRoad(index: number, isMain: boolean = false, color: string = "white", updatedStartY?: number | undefined, item?: DetailedListItem) {
        let road = new RoadModel(this.id + "-" + this.counter, this.startDate!, index, color, isMain, item);
        if (updatedStartY && road.getCardData()) road.getCardData().setY(updatedStartY);

        this.roads.push(road);
        const newLength = this.roads[this.roads.length - 1].getRoadLength();

        if (this.roadmapLength == undefined || this.roadmapLength < newLength!)
            this.roadmapLength = newLength;

        this.counter++;
    }

    update(startX_X_value: number, transitionX: number, cap: number, transitionY: number) {
        if (this.groups)
            this.groups.update(startX_X_value, transitionX, cap, transitionY)
        this.roads.forEach(road => road.update(startX_X_value, transitionX, cap, transitionY));
    }

    getRoads() {
        return this.roads;
    }

    getGroups() {
        return this.groups;
    }

    getId() {
        return this.id;
    }

    getRoadmapLength() {
        return this.roadmapLength;
    }

}

export { RoadmapModel };

