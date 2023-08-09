interface MyImageItem {
    name: string;
    alt: string;
    path?: string;
    url?: string;
}
class DetailedListItem {
    private id: any;
    private title?: string | undefined;
    private site?: string | undefined;
    private description?: Array<string> | undefined;
    private startDate?: string | undefined;
    private endDate?: string | "Present" | undefined;
    private hours?: string | undefined;
    private links?: Array<{}> | undefined;
    private tags?: Array<string> | undefined;
    private images?: Array<MyImageItem> | undefined;

    constructor(
        id: any,
        title?: string,
        site?: string,
        description?: Array<string>,
        startDate?: string,
        endDate?: string,
        hours?: string,
        links?: Array<{}>,
        tags?: Array<string>,
        images?: Array<MyImageItem>,
    ) {
        this.id = id;
        this.title = title;
        this.site = site;
        this.description = description;
        this.startDate = startDate;
        this.endDate = endDate;
        this.hours = hours;
        this.links = links;
        this.tags = tags;
        this.images = images;
    }

    getId() {
        return this.id;
    }

    getTitle() {
        return this.title;
    }

    getSite() {
        return this.site;
    }

    getDescription() {
        return this.description;
    }

    getStartDate() {
        return this.startDate;
    }

    getEndDate() {
        return this.endDate;
    }

    getHours() {
        return this.hours;
    }

    getLinks() {
        return this.links;
    }

    getTags() {
        return this.tags;
    }

    getImages() {
        return this.images;
    }

    toObject() {
        const obj = {
            id: this.id,
            title: this.title,
            site: this.site,
            description: this.description,
            startDate: this.startDate,
            endDate: this.endDate,
            hours: this.hours,
            links: this.links,
            tags: this.tags,
            images: this.images,
        };

        return Object.fromEntries(Object.entries(obj).filter(([_, value]) => value !== undefined));
    }

    static objectsToItemsList(objects: Array<any>) {
        var items: DetailedListItem[] = [];
        objects.forEach(ob => {

            items.push(new DetailedListItem(
                ob["id"],
                ob["title"],
                ob["site"],
                ob["description"],
                ob["startDate"],
                ob["endDate"],
                ob["hours"],
                ob["links"],
                ob["tags"],
                ob["images"],
            ));
        });

        return items;
    }


}

export { DetailedListItem };
export type { MyImageItem };

