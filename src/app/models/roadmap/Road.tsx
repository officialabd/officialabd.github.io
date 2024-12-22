import Utilities from '@/app/utilities/BasicUtil';
import Constants from '@/app/utilities/Constants';
import { DetailedListItem } from '../Item';
import { CardData } from './data/CardData';
import { CirclesData } from './data/CirclesData';
import { LineData } from './data/LineData';
import { TextsData } from './data/TextsData';

class RoadModel {
    private id: any;
    private lineData!: LineData;
    private circlesData!: CirclesData;
    private textsData!: TextsData;
    private cardData!: CardData;
    private index: number;
    private startY: number = 0;
    private roadLength?: number;
    private color: string;
    private mainStartDate: Date;
    private startDate?: Date;
    private endDate?: Date;
    private item?: DetailedListItem;
    private isMain: boolean;

    constructor(
        id: any,
        mainStartDate: Date,
        index: number,
        color: string,
        isMain: boolean = false,
        item?: DetailedListItem,
    ) {
        this.id = id + "-road";
        this.index = index;
        this.color = color;
        this.isMain = isMain;
        this.item = item
        this.mainStartDate = mainStartDate

        this.initialize();
    }

    initialize() {
        if (this.isMain) this.setAsMainRoad();
        else this.setRoad();
    }

    private setAsMainRoad() {
        this.startDate = this.mainStartDate
        this.endDate = new Date();

        this.roadLength = Utilities.calculateDifferenceAsLength(this.endDate, this.startDate);

        this.lineData = new LineData(
            this.id,
            this.index,
            0,
            this.index,
            this.roadLength
        );

        this.circlesData = new CirclesData();
        this.textsData = new TextsData();

        this.addMainYears(this.startDate, this.endDate);
    }

    private addMainYears(startDate: Date, currentDate: Date) {
        const yearNums = currentDate.getFullYear() - startDate.getFullYear() + 1

        for (let yearNo = 0; yearNo < yearNums; yearNo++) {
            const year = startDate.getFullYear() + yearNo
            let tempDate = startDate
            if (yearNo > 0) {
                tempDate = new Date(year, 0, 1);
            }
            let differenceBetweenYears = Utilities.calculateDifferenceAsLength(tempDate, startDate);
            this.circlesData.addCircle(
                this.id,
                this.index,
                differenceBetweenYears,
                Constants.ROADMAP_CONFIGS.YEAR_CIRCLE_RADIUS,
                this.color
            )

            this.textsData.addText(
                this.id,
                this.index,
                differenceBetweenYears,
                year + "",
                16,
                this.color
            );
        }

    }

    private setRoad() {
        this.startDate = Utilities.toDate(this.item!.getStartDate()!);
        this.endDate = Utilities.toDate(this.item!.getEndDate()!, this.item!.getStartDate()!);

        this.startY = Utilities.calculateDifferenceAsLength(this.startDate, this.mainStartDate);

        this.roadLength = Utilities.calculateDifferenceAsLength(this.endDate, this.startDate);

        this.lineData = new LineData(
            this.id,
            this.index,
            this.startY,
            this.index,
            this.startY + this.roadLength
        );

        this.circlesData = new CirclesData();
        this.circlesData.addCircle(
            this.id,
            this.index,
            this.startY,
            Constants.ROADMAP_CONFIGS.CIRCLE_RADIUS,
            this.color
        );

        if (this.item?.getTimeline()?.group == undefined)
            this.cardData = new CardData(
                this.id,
                0,
                this.startY,
                this.color,
                this.item?.getTimeline()?.direction!,
                this.item!,
                this.item?.getTimeline()?.group,
                this.item?.getTimeline()?.isMain
            )
    }

    update(startX_X_value: number, transitionX: number, cap: number, transitionY: number) {
        if (this.lineData)
            this.lineData.update(startX_X_value, transitionX, cap, transitionY)
        if (this.circlesData)
            this.circlesData.updateCircles(startX_X_value, transitionX, cap, transitionY, 10)
        if (this.textsData)
            this.textsData.updateTexts(startX_X_value, transitionX, cap, transitionY)
        if (this.cardData)
            this.cardData.update(startX_X_value, transitionX, cap, transitionY)
    }

    clone() {
        return new RoadModel(
            this.getId(),
            this.getMainStartDate(),
            this.getIndex(),
            this.getColor(),
            this.isMainRoad(),
            this.getItem()
        )
    }

    getId() {
        return this.id;
    }

    getIndex() {
        return this.index;
    }

    addCircle(id: any, cx: number, cy: number, r: number, color: string) {
        this.circlesData.addCircle(id, cx, cy, r, color);
    }

    getLineData() {
        return this.lineData;
    }

    getCirclesData() {
        return this.circlesData;
    }

    getTextData() {
        return this.textsData;
    }

    getColor() {
        return this.color;
    }

    getMainStartDate() {
        return this.mainStartDate;
    }

    getStartDate() {
        return this.startDate;
    }

    getEndDate() {
        return this.endDate;
    }

    getItem() {
        return this.item;
    }

    isMainRoad() {
        return this.isMain;
    }

    getCardData() {
        return this.cardData;
    }

    getStartY() {
        return this.startY;
    }

    getRoadLength() {
        return this.roadLength;
    }

}

export { RoadModel };

