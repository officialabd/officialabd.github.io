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
        <svg key={roadmap.getId()} width="100%" height="10000" style={{ backgroundColor: "#fffffff", overflow: "visible" }} >
            {(!loading) &&
                roadmap.getRoads().map((road, i) => (
                    <Road key={road.getId() + i} road={road} color={road.getColor()} />
                ))
            }
        </svg>
    );
};

export default Roadmap;