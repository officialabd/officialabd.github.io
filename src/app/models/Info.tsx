export class Info {
    private id: any;
    private name?: string | undefined;
    private title?: string | undefined;
    private jobTitle?: string | undefined;
    private jobLocation?: string | undefined;
    private note?: string | undefined;
    private email?: string | undefined;
    private phone?: string | undefined;
    private links?: Array<{}> | undefined;

    constructor(
        id: any,
        name?: string,
        title?: string,
        jobTitle?: string,
        jobLocation?: string,
        note?: string,
        email?: string,
        phone?: string,
        links?: Array<{}>,
    ) {
        this.id = id;
        this.name = name;
        this.title = title;
        this.jobTitle = jobTitle;
        this.jobLocation = jobLocation;
        this.note = note;
        this.email = email;
        this.phone = phone;
        this.links = links;
    }

    getId() {
        return this.id;
    }

    getName() {
        return this.name;
    }

    getTitle() {
        return this.title;
    }

    getJobTitle() {
        return this.jobTitle;
    }

    getJobLocation() {
        return this.jobLocation;
    }

    getNote() {
        return this.note;
    }

    getLinks() {
        return this.links;
    }

    getEmail() {
        return this.email;
    }

    getPhone() {
        return this.phone;
    }

    toObject() {
        const obj = {
            id: this.id,
            name: this.name,
            title: this.title,
            jobTitle: this.jobTitle,
            jobLocation: this.jobLocation,
            note: this.note,
            links: this.links,
            email: this.email,
            phone: this.phone,
        };

        return Object.fromEntries(Object.entries(obj).filter(([_, value]) => value !== undefined));
    }

    static toInfo(object: any) {
        return new Info(
            object["id"],
            object["name"],
            object["title"],
            object["jobTitle"],
            object["jobLocation"],
            object["note"],
            object["email"],
            object["phone"],
            object["links"],
        );
    }

    static objectsToItemsList(objects: Array<any>) {
        var items: Info[] = [];
        objects.forEach(ob => {
            items.push(Info.toInfo(ob));
        });

        return items;
    }


}