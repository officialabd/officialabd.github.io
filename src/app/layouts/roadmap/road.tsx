// components/Road.tsx
'use client';

import { RoadModel } from "@/app/models/roadmap/Road";
import Constants from "@/app/utilities/Constants";
import { useEffect, useState } from "react";
import RoadmapCard from "./roadmap_card";

function useScreenWidth(): number | null {
    const [screenWidth, setScreenWidth] = useState<number | null>(null);

    useEffect(() => {
        const updateWidth = () => setScreenWidth(window.innerWidth);

        updateWidth();

        window.addEventListener("resize", updateWidth);

        return () => window.removeEventListener("resize", updateWidth);
    }, []);

    return screenWidth;
}

function useScreenHeight(): number | null {
    const [screenHeight, setScreenHeight] = useState<number | null>(null);

    useEffect(() => {
        const updateHeight = () => setScreenHeight(window.innerHeight);

        updateHeight();

        window.addEventListener("resize", updateHeight);

        return () => window.removeEventListener("resize", updateHeight);
    }, []);

    return screenHeight;
}

const Road = (
    {
        road,
        loading
    }: {
        road?: RoadModel,
        loading: boolean
    }) => {

    let item = undefined;
    if (!loading) {
        item = road?.getItem();
    }

    const screenWidth = useScreenWidth()
    const screenHeight = useScreenHeight()

    road!.update(20, screenWidth! / 2, 20, Constants.ROADMAP_CONFIGS.Y_STARTING_POINT + Constants.ROADMAP_CONFIGS.Y_STARTING_POINT);

    return (
        <>
            <path
                d={road?.getLineData().getPathData()}
                fill="none"
                stroke={road?.getColor()}
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
                        cx={circle.getCx_c()}
                        cy={circle.getCy_c()}
                        r={circle.getR_c()}
                        fill={road?.getColor()}
                        filter="url(#circleShadow)"
                    />
                ))
            }
            {road?.getTextData() &&
                road?.getTextData().getTexts().map((text, i) => (
                    <text
                        key={text.getId() + i}
                        x={text.getX_c()}
                        y={text.getY_c()}
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
            {road?.getItem() && !road.isMainRoad() &&
                <RoadmapCard loading={loading} item={item!} cardData={road.getCardData()} title="Testing" color={road?.getColor()!} />
            }
        </>
    );
};

export default Road;
