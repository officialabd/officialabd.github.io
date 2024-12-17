class Text {
    private id: any;
    private x: number;  // X-coordinate for the text position
    private y: number;  // Y-coordinate for the text position
    private textContent: string; // The content of the text
    private fontSize: number; // Font size of the text
    private fill: string; // Fill color of the text

    constructor(id: any, x: number, y: number, textContent: string, fontSize: number, fill: string) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.textContent = textContent;
        this.fontSize = fontSize;
        this.fill = fill;
    }

    getId() {
        return this.id;
    }

    getTextData() {
        return `x="${this.x}" y="${this.y}" font-size="${this.fontSize}" fill="${this.fill}">${this.textContent}</text>`;
    }

    setTextAttributes(x: number, y: number, textContent: string, fontSize: number, fill: string) {
        this.x = x;
        this.y = y;
        this.textContent = textContent;
        this.fontSize = fontSize;
        this.fill = fill;
    }
}

export { Text };

