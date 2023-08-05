export class Technology {
    private id: any;
    private name?: string | undefined;
    private svgCode?: string | undefined;

    constructor(
        id: any,
        name?: string,
        svgCode?: string,
    ) {
        this.id = id;
        this.name = name;
        this.svgCode = svgCode;
    }

    getId() {
        return this.id;
    }

    getName() {
        return this.name;
    }

    getSvgCode() {
        return this.svgCode;
    }

    toObject() {
        const obj = {
            id: this.id,
            name: this.name,
            svgCode: this.svgCode,
        };

        return Object.fromEntries(Object.entries(obj).filter(([_, value]) => value !== undefined));
    }

    static toInfo(object: any) {
        return new Technology(
            object["id"],
            object["name"],
            object["svgCode"],
        );
    }

    static objectsToItemsList(objects: Array<any>) {
        var items: Technology[] = [];
        objects.forEach(ob => {
            items.push(Technology.toInfo(ob));
        });

        return items;
    }


}