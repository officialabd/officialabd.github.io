import { DetailedListItem } from "../../Item";

class CardData {
    private id: any;
    private x: number;
    private y: number;
    private x_c?: number;
    private y_c?: number;
    private color: string;
    private groupId?: number;
    private isMainGroupItem?: boolean;
    private direction: string;
    private item: DetailedListItem;

    constructor(id: any, x: number, y: number, color: string, direction: string, item: DetailedListItem, groupId?: number, isMainGroupItem: boolean = false) {
        this.id = id + "-Card";
        this.x = x;
        this.y = y;
        this.color = color;
        this.direction = direction;
        this.groupId = groupId;
        this.isMainGroupItem = isMainGroupItem;
        this.item = item;

        this.update(20, 500, 20, 0)
    }

    update(startX_X_value: number, transitionX: number, cap: number, transitionY: number) {
        if (this.x == 0) cap = 0;
        this.x_c = this.x * startX_X_value + transitionX + cap
        this.y_c = this.y + transitionY;
    }

    setY(addToY: number) {
        this.y += addToY;
        this.update(20, 500, 20, 0)
    }

    getId() {
        return this.id;
    }

    getX(): number {
        return this.x;
    }

    getY(): number {
        return this.y;
    }

    getX_c(): number | undefined {
        return this.x_c;
    }

    getY_c(): number | undefined {
        return this.y_c;
    }

    getColor(): string {
        return this.color;
    }

    getDirection(): string {
        return this.direction;
    }

    getGroupId(): number | undefined {
        return this.groupId;
    }

    getIsMainGroupItem(): boolean | undefined {
        return this.isMainGroupItem;
    }

    getItem(): DetailedListItem {
        return this.item;
    }

}

export { CardData };

