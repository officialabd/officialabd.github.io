import { DetailedListItem } from "../../Item";
import { CardData } from "./CardData";

class CardDataGroup {
    private cardsData: CardData[] = [];
    private counter = 0;
    private groupId: number;

    constructor(groupId: number) {
        this.groupId = groupId;
    }

    addCardData(id: any, x: number, y: number, color: string, direction: string, item: DetailedListItem, isMainGroupItem: boolean) {
        this.cardsData.push(
            new CardData(id + "-" + this.counter, x, y, color, direction, item, this.groupId, isMainGroupItem)
        );
        this.counter++;
    }

    update(startX_X_value: number, transitionX: number, cap: number, transitionY: number) {
        this.cardsData.forEach(cardData => {
            cardData.update(startX_X_value, transitionX, cap, transitionY)
        })
    }

    findMainCardData(): CardData | undefined {
        return this.cardsData.find(cardData => cardData.getIsMainGroupItem()) || this.cardsData[0]
    }

    getCardsData() {
        return this.cardsData
    }

    getGroupId() {
        return this.groupId
    }
}

export { CardDataGroup };

