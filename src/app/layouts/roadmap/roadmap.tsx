// components/Roadmap.tsx
'use client';

import { DetailedListItem } from "@/app/models/Item";
import { RoadmapModel } from "@/app/models/roadmap/Roadmap";
import Road from "./road";

const Roadmap = (
    {
        id, title, items, loading = true
    }: {
        id: any, title: string, items: Array<DetailedListItem>, loading?: boolean
    }) => {

    let roadmap: RoadmapModel;

    if (!loading) {
        roadmap = new RoadmapModel(id, items, true, "white");
    }

    return (
        <>
            {loading ?
                <>Loading</> // ToDo
                :
                <svg key={roadmap!.getId()} width="100%" height="3500" style={{ backgroundColor: "#fffffff" }} >
                    {
                        roadmap!.getRoads().map((road, i) => (
                            <Road
                                key={road.getId() + "-" + i}
                                road={road}
                                loading={loading}
                            />
                        ))
                    }
                </svg>
            }
        </>);
};

export default Roadmap;