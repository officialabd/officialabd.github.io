import { Text } from "./Text";

class TextsData {
    private texts: Text[] = [];

    // Add text to the TextsData
    addText(text: Text) {
        this.texts.push(text);
    }

    // Get all text data as a string for SVG output
    getTextData() {
        return this.texts.map(text => text.getTextData()).join(' ');
    }
}

export { TextsData };

