export class DetailedListItem {
    private title?: string | undefined;
    private site?: string | undefined;
    private description?: Array<string> | undefined;
    private startDate?: string | undefined;
    private endDate?: string | "Present" | undefined;
    private hours?: number | 0 | undefined;
    private links?: Array<[string, string]> | undefined;

    constructor(
        title?: string,
        site?: string,
        description?: Array<string>,
        startDate?: string,
        endDate?: string,
        hours?: number,
        links?: Array<[string, string]>
    ) {
        this.title = title;
        this.site = site;
        this.description = description;
        this.startDate = startDate;
        this.endDate = endDate;
        this.hours = hours;
        this.links = links;
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

}