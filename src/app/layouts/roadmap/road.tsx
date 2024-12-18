// components/Canvas.tsx
'use client';

import { RoadModel } from "@/app/models/roadmap/Road";

const Road = (
    {
        color,
        road
    }: {
        color: string,
        road?: RoadModel
    }) => {

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
