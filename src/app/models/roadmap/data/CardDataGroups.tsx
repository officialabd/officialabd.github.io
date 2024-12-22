import { CardData } from "./CardData";
import { CardDataGroup } from "./CardDataGroup";

class CardDataGroups {
    private groups: CardDataGroup[] = [];
    private counter = 0;

    addCardDataToGroup(cardData: CardData) {
        let group = this.findGroup(cardData.getGroupId()!);
        if (!group) {
            group = new CardDataGroup(cardData.getGroupId()!);
            this.groups.push(group);
        }
        group.addCardData(
            cardData.getId()! + "-" + this.counter,
            cardData.getX(),
            cardData.getY(),
            cardData.getColor(),
            cardData.getDirection(),
            cardData.getItem(),
            cardData.getIsMainGroupItem()!
        );
        this.counter++;
    }

    findGroup(groupId: number): CardDataGroup | undefined {
        return this.groups.find(group => group.getGroupId() == groupId)
    }

    update(startX_X_value: number, transitionX: number, cap: number, transitionY: number) {
        this.groups.forEach(group => {
            group.update(startX_X_value, transitionX, cap, transitionY)
        })
    }

    getCardsData() {
        return this.groups
    }

}

export { CardDataGroups };

