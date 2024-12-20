import { Text } from "./Text";

class TextsData {
    private texts: Text[] = [];
    private counter = 0;

    addText(
        id: any,
        x: number,
        y: number,
        textContent: string,
        fontSize: number,
        fill: string,
    ) {
        this.texts.push(new Text(id + "-" + this.counter, x, y, textContent, fontSize, fill));
        this.counter++;
    }

    updateTexts(startX_X_value: number, transitionX: number, cap: number, transitionY: number) {
        this.texts.forEach(text => {
            text.update(startX_X_value, transitionX, cap, transitionY)
        })
    }

    getTexts() {
        return this.texts;
    }


}

export { TextsData };

