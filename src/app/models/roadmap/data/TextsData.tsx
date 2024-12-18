import { Text } from "./Text";

class TextsData {
    private texts: Text[] = [];

    // Add text to the TextsData
    addTextObj(text: Text) {
        this.texts.push(text);
    }

    addText(
        id: any,
        x: number,
        y: number,
        textContent: string,
        fontSize: number,
        fill: string,
    ) {
        this.texts.push(new Text(id, x, y, textContent, fontSize, fill));
    }


    // Get all text data as a string for SVG output
    getTextData() {
        return this.texts.map(text => text.getTextData()).join(' ');
    }

    getTexts() {
        return this.texts;
    }


}

export { TextsData };

