// components/Roadmap.tsx
'use client';

import { DetailedListItem } from "@/app/models/Item";
import { RoadmapModel } from "@/app/models/roadmap/Roadmap";
import Utilities from "@/app/utilities/BasicUtil";
import Constants from "@/app/utilities/Constants";
import CustomWrapper from "./customWrapper";
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

        const screenWidth = Utilities.useScreenWidth();

        roadmap!.update(10, screenWidth! / 2, 0, Constants.ROADMAP_CONFIGS.Y_STARTING_POINT);

    }


    return (
        <>
            {loading ?
                <>Loading</> // ToDo
                :
                <svg
                    xmlns="http://www.w3.org/2000/svg"
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
                    {
                        roadmap!.getGroups().getCardsData().map((group, i) => (
                            <CustomWrapper
                                key={group.getGroupId() + "-CustomWrapper-" + i}
                                cardData={group.findMainCardData()!}
                            >
                                <GroupCard
                                    cardsData={group}
                                    key={group.getGroupId() + "-GroupCard-" + i}
                                    loading={loading}
                                />

                            </CustomWrapper>
                        ))

                    }
                </svg>
            }
        </>);
};

export default Roadmap;