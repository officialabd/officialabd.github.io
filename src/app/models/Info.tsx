interface Link {
    name: string;
    link: string;
    svgCode: string;
    bgColor: string;
}
export class Info {
    // private id: any;

    private name?: string | undefined;
    private title?: string | undefined;
    private jobTitle?: string | undefined;
    private jobLocation?: string | undefined;
    private note?: string | undefined;
    private email?: string | undefined;
    private phone?: string | undefined;
    private copyright?: string | undefined;
    private links?: {} | undefined;
    private links0?: Link[] | undefined;
    private description?: string | undefined;
    private whatIMake?: string | undefined;

    constructor(
        // id: any,
        name?: string,
        title?: string,
        jobTitle?: string,
        jobLocation?: string,
        note?: string,
        email?: string,
        phone?: string,
        copyright?: string,
        links?: {},
        links0?: Link[] | undefined,
        description?: string | undefined,
        whatIMake?: string | undefined,
    ) {
        // this.id = id;
        this.name = name;
        this.title = title;
        this.jobTitle = jobTitle;
        this.jobLocation = jobLocation;
        this.note = note;
        this.email = email;
        this.phone = phone;
        this.copyright = copyright;
        this.links = links;
        this.links0 = links0;
        this.description = description;
        this.whatIMake = whatIMake;
    }

    // getId() {
    //     return this.id;
    // }

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

    getLinks(): any {
        return this.links!;
    }

    getLinks0(): Link[] {
        return this.links0!;
    }

    getEmail() {
        return this.email;
    }

    getPhone() {
        return this.phone;
    }

    getCopyright() {
        return this.copyright;
    }

    getDescription() {
        return this.description;
    }

    getWhatIMake() {
        return this.whatIMake;
    }

    toObject() {
        const obj = {
            // id: this.id,
            name: this.name,
            title: this.title,
            jobTitle: this.jobTitle,
            jobLocation: this.jobLocation,
            note: this.note,
            links: this.links,
            email: this.email,
            phone: this.phone,
            links0: this.links0,
            description: this.description,
            whatIMake: this.whatIMake,
        };

        return Object.fromEntries(Object.entries(obj).filter(([_, value]) => value !== undefined));
    }

    static toInfo(object: any) {
        return new Info(
            // object["id"],
            object["name"],
            object["title"],
            object["jobTitle"],
            object["jobLocation"],
            object["note"],
            object["email"],
            object["phone"],
            object["copyright"],
            object["links"],
            object["links0"],
            object["description"],
            object["whatIMake"],
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