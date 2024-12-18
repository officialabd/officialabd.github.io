// components/Canvas.tsx
'use client';

import { LineData } from "@/app/models/roadmap/data/LineData";
import { RoadModel } from "@/app/models/roadmap/Road";

const Road = (
    {
        xNum,
        yNum,
        color,
        road
    }: {
        xNum: number,
        yNum: number,
        color: string,
        road?: RoadModel
    }) => {
    const ld = new LineData('12', 50 + xNum, 50 + yNum);

    ld.addHorizontalLine(1300)
        .addArc(50, 50, 0, 0, 1, 1350 + xNum, 100 + yNum)
        .addVerticalLine(200 + yNum)
        .addArc(50, 50, 0, 0, 1, 1300 + xNum, 250 + yNum)
        .addHorizontalLine(100 + xNum)
        .addArc(50, 50, 0, 0, 0, 50 + xNum, 300 + yNum)
        .addVerticalLine(400 + yNum)
        .addArc(50, 50, 0, 0, 0, 100 + xNum, 450 + yNum)
        .addHorizontalLine(1300 + xNum);


    return (
        <>
            <path
                d={road?.getLineData()}
                fill="none"
                stroke={color}
                strokeWidth="10"
                key={road?.getId()}
                id={road?.getId()}
                strokeLinecap="round"
            />

            <defs>
                <filter id="circleShadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="rgba(0, 0, 0, 0.5)" />
                </filter>
            </defs>
            {road?.getCirclesData() &&
                road?.getCirclesData().getCircles().map((circle, i) => (
                    <circle
                        key={circle.getId() + i}
                        cx={circle.getCx()}
                        cy={circle.getCy()}
                        r={circle.getR()}
                        fill={color}
                        filter="url(#circleShadow)"
                    />
                ))
            }
            {road?.getTextData() &&
                road?.getTextData().getTexts().map((text, i) => (
                    <text
                        key={text.getId() + i}
                        x={text.getX()}
                        y={text.getY()}
                        fill="black"
                        fontSize="14"
                        fontWeight="bold"
                        textAnchor="middle"
                        dominantBaseline="middle"
                    >
                        {text.getTextContent()}
                    </text>
                ))
            }
        </>
    );
};

export default Road;
