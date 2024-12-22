// components/Roadmap.tsx
'use client';

import { DetailedListItem } from "@/app/models/Item";
import { RoadmapModel } from "@/app/models/roadmap/Roadmap";
import Constants from "@/app/utilities/Constants";
import GroupCard from "./group_card";
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
                <svg
                    key={roadmap!.getId()}
                    width="100%"
                    height={roadmap!.getRoadmapLength()! + Constants.ROADMAP_CONFIGS.Y_STARTING_POINT}
                    style={{ overflow: "visible", backgroundColor: "#fffffff" }}
                >
                    {
                        roadmap!.getRoads().map((road, i) => (
                            <Road
                                key={road.getId() + "-" + i}
                                road={road}
                                loading={loading}
                            />
                        ))
                    }
                    <GroupCard
                        cardsData={roadmap!.getRoads().map(road => road.getCardData())}
                        items={items}
                        title="Test"
                        key="234r"
                        loading={loading}
                    />
                </svg>
            }
        </>);
};

export default Roadmap;