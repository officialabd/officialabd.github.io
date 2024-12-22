import { CardData } from "@/app/models/roadmap/data/CardData";
import Utilities from "@/app/utilities/BasicUtil";
import { ReactNode, useRef } from "react";

export default function CustomWrapper(
    { children, cardData }: { children: ReactNode, cardData: CardData }) {

    const screenWidth = Utilities.useScreenWidth();
    const foreignObjectRef = useRef<SVGForeignObjectElement>(null);

    let cardWidth = foreignObjectRef.current?.getBoundingClientRect().width;
    const x = cardData.getDirection() === "left"
        ? screenWidth! / 4 - (cardWidth! / 2) + ""
        : (screenWidth! * 3 / 4) - (cardWidth! / 2) + "";

    return <foreignObject
        xmlns="http://www.w3.org/1999/xhtml"
        ref={foreignObjectRef}
        style={{ overflow: "visible", cursor: "pointer" }}
        width="33%"
        x={x}
        y={cardData.getY_c()}
        height="150"
    >
        {children}
    </foreignObject>
}