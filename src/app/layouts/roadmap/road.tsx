// components/Canvas.tsx
'use client';

import { LineData } from "@/app/models/roadmap/data/LineData";

const Road = (
    {
        xNum,
        yNum,
        color
    }: {
        xNum: number,
        yNum: number,
        color: string,
    }) => {
    const ld = new LineData('12', 50 + xNum, 50 + yNum);

    ld
        .addHorizontalLine(1300)
        .addArc(50, 50, 0, 0, 1, 1350 + xNum, 100 + yNum)
        .addVerticalLine(200 + yNum)
        .addArc(50, 50, 0, 0, 1, 1300 + xNum, 250 + yNum)
        .addHorizontalLine(100 + xNum)
        .addArc(50, 50, 0, 0, 0, 50 + xNum, 300 + yNum)
        .addVerticalLine(400 + yNum)
        .addArc(50, 50, 0, 0, 0, 100 + xNum, 450 + yNum)
        .addHorizontalLine(1300 + xNum)

    console.log(ld.getPathData())

    return (
        <>
            <path
                d={ld.getPathData()}
                fill="none"
                stroke={color}
                strokeWidth="2"
            />
            {/* <circle cx="50" cy="30" r="8" fill={color} /> */}
            {/* <text x="60" y="30" fill={color} fontSize="14">Demo</text> */}
        </>
    );
};

export default Road;
