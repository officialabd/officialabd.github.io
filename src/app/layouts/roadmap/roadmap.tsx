// components/Road.tsx
'use client';

import { DetailedListItem } from "@/app/models/Item";
import { RoadmapModel } from "@/app/models/roadmap/Roadmap";
import Road from "./road";

const Roadmap = (
    {
        title, items, loading = true
    }: {
        title: string, items: Array<DetailedListItem>, loading?: boolean
    }) => {
    const roadmap = new RoadmapModel("roadmap");
    const colors = ["pink", "lightblue", "red", "orange", "green", "cyan", "blue", "yellow", "purple", "brown"]
    const margins = [-140, -120, -100, -80, -60, -40, 40, 60, 80, 100]

    if (!loading) {
        let min_date: Date | undefined = undefined;
        items.forEach(item => {
            const sd = new Date(item.getStartDate()!);
            if (min_date == undefined || sd.getTime() < min_date.getTime())
                min_date = sd;
        })

        roadmap.addMainRoad(min_date!, "white");
        items.forEach((item, i) => {
            roadmap.addRoad(item, min_date!, margins[i], colors[i]);
        });
    }

    return (
        <svg key={'svg-12'} width="100%" height="10000" style={{ backgroundColor: "#fffffff", overflow: "visible" }} >
            {(!loading) &&
                roadmap.getRoads().map((road, i) => (
                    <Road key={road.getId() + i} road={road} color={road.getColor()} xNum={0} yNum={0} />
                ))
            }
        </svg>
    );
};

export default Roadmap;


// {/* Title */}
// <text x="200" y="30" fontSize="20" fill="black">
//     SVG Path Types Demo
// </text>

// {/* 1. Straight Line */}
// <path d="M 50 50 L 250 50" stroke="black" strokeWidth="2" fill="none" />
// <text x="260" y="55" fontSize="14" fill="black">
//     Straight Line (L)
// </text>

// {/* 2. Horizontal Line */}
// <path d="M 50 100 H 250" stroke="blue" strokeWidth="2" fill="none" />
// <text x="260" y="105" fontSize="14" fill="blue">
//     Horizontal Line (H)
// </text>

// {/* 3. Vertical Line */}
// <path d="M 50 150 V 200" stroke="green" strokeWidth="2" fill="none" />
// <text x="70" y="180" fontSize="14" fill="green">
//     Vertical Line (V)
// </text>

// {/* 4. Quadratic Bézier Curve */}
// <path d="M 50 250 Q 150 150 250 250" stroke="red" strokeWidth="2" fill="none" />
// <text x="260" y="255" fontSize="14" fill="red">
//     Quadratic Bézier (Q)
// </text>

// {/* 5. Smooth Quadratic Bézier Curve */}
// <path d="M 50 300 T 250 300" stroke="orange" strokeWidth="2" fill="none" />
// <text x="260" y="305" fontSize="14" fill="orange">
//     Smooth Quadratic (T)
// </text>

// {/* 6. Cubic Bézier Curve */}
// <path d="M 50 350 C 100 300, 200 400, 250 350" stroke="purple" strokeWidth="2" fill="none" />
// <text x="260" y="355" fontSize="14" fill="purple">
//     Cubic Bézier (C)
// </text>

// {/* 7. Smooth Cubic Bézier Curve */}
// <path d="M 50 400 S 200 500, 250 450" stroke="brown" strokeWidth="2" fill="none" />
// <text x="260" y="455" fontSize="14" fill="brown">
//     Smooth Cubic (S)
// </text>

// {/* 8. Arc */}
// <path
//     d="M 50 500 A 50 50 0 0 1 150 500"
//     stroke="cyan"
//     strokeWidth="2"
//     fill="none"
// />
// <text x="160" y="505" fontSize="14" fill="cyan">
//     Arc (A)
// </text>

// {/* 9. Closed Path */}
// <path
//     d="M 50 550 H 150 V 600 H 50 Z"
//     stroke="magenta"
//     strokeWidth="2"
//     fill="none"
// />
// <text x="160" y="580" fontSize="14" fill="magenta">
//     Closed Path (Z)
// </text>
