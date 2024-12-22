// components/Road.tsx
'use client';

import { RoadModel } from "@/app/models/roadmap/Road";
import CustomWrapper from "./customWrapper";
import RoadmapCard from "./roadmap_card";

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

    // const screenWidth = Utilities.useScreenWidth();

    // road!.update(10, screenWidth! / 2, 0, Constants.ROADMAP_CONFIGS.Y_STARTING_POINT);

    return (
        <>
            <path
                d={road?.getLineData().getPathData()}
                fill="none"
                stroke={road?.getColor()}
                strokeWidth={road?.isMainRoad() ? "7" : "5"}
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
                    !road.isMainRoad() ?
                        <circle
                            className=""
                            key={circle.getId() + i}
                            cx={circle.getCx_c()}
                            cy={circle.getCy_c()}
                            r={circle.getR_c()}
                            fill={road?.getColor()}
                            filter="url(#circleShadow)"
                        />
                        :
                        <rect
                            className="rounded-lg"
                            key={circle.getId() + i}
                            x={circle.getCx_c()! - (circle.getR_c()! * 1.6 / 2)}
                            y={circle.getCy_c()! - (circle.getR_c()! * 0.9 / 2)}
                            width={circle.getR_c()! * 1.6}
                            height={circle.getR_c()! * 0.9}
                            fill={road?.getColor()}
                            fillOpacity={0.9}
                            filter="url(#circleShadow)"
                            rx={10}
                            ry={10}
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
                        fontSize="18"
                        fontWeight="bold"
                        textAnchor="middle"
                        dominantBaseline="middle"
                    >
                        {text.getTextContent()}
                    </text>
                ))
            }
            {road?.getItem() && !road.isMainRoad() && road.getCardData() &&
                <CustomWrapper
                    key={road.getId() + "-road-card-wrapper"}
                    cardData={road.getCardData()}
                >
                    <RoadmapCard
                        loading={loading}
                        item={item!}
                        cardData={road.getCardData()}
                        title="Testing"
                    />
                </CustomWrapper>
            }
        </>
    );
};

export default Road;
