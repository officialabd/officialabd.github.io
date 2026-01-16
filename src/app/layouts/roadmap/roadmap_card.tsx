// components/RoadmapCard.tsx
'use client';

import MultiLinePulse from "@/app/_layouts/pulse/multiLine";
import Basic from "@/app/_layouts/texts/basic";
import { DetailedListItem } from "@/app/models/Item";
import { CardData } from "@/app/models/roadmap/data/CardData";

const RoadmapCard = (
    {
        title,
        item,
        cardData,
        loading = false,
        isGroupItem = false,
        isHovered = false
    }: {
        title: string,
        item: DetailedListItem,
        cardData: CardData,
        loading?: boolean
        isGroupItem?: boolean
        isHovered?: boolean
    }) => {

    return (
        <>
            <div
                className="w-full h-full"
                style={{ overflow: "visible", cursor: "pointer" }}
                onClick={() => console.log("Clicked")}
            >
                {loading ?
                    <ListItemNode
                        key={`temp-loading-${title}`}
                        id={`temp-loading-${title}`}
                        item={new DetailedListItem({})}
                        loading={loading}
                    />
                    :
                    <ListItemNode
                        key={"item.getId()"}
                        id={"item.getId()"}
                        item={item}
                        color={cardData.getColor()}
                        loading={loading}
                        isGroupItem={isGroupItem}
                        isHovered={isHovered}
                    />
                }
            </div>
        </>
    );
};

const ListItemNode = (
    { id,
        item,
        color,
        loading = false,
        isGroupItem = false,
        isHovered = false
    }: {
        id: any,
        item: DetailedListItem,
        color?: string,
        loading?: boolean,
        isGroupItem?: boolean,
        isHovered?: boolean
    }) => {
    return <>
        <div key={id}
            className={`bg-clip-padding bg-opacity-60 rounded-xl ${isGroupItem && isHovered ? "shadow-lg shadow-black/30" : "shadow-[0px_0px_7px_5px_rgba(0,0,0,0.1)] drop-shadow-lg hover:shadow-[0px_0px_8px_6px_rgba(195,254,244,0.4)] transition-shadow duration-200}"}`}
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                borderRadius: '8px',
                background: "#C9E9D2"
            }}>
            <div style={{
                width: '100%',
                overflow: "clip"
            }}>
                <div style={{
                    width: '100%',
                    height: '5%',
                    backgroundColor: color,
                    display: 'block',
                    justifyContent: 'center',
                    borderRadius: '8px 8px 0 0',
                    borderWidth: 0
                }} />

                <div className=" w-full flex min-h-10 p-2 items-start justify-between shadow-md content-center bg-[#FEF9F2]">
                    <div className="h-full">
                        <Basic text={item.getTitle()!}
                            fontFamily="font-Nunito"
                            fontSize="text-medium"
                            textColor="text-[#1C1678]"
                            fontWeight="font-semibold"
                            other="flex items-start justify-between content-center"
                            loading={loading}
                            linePulseWidth="w-72"
                        />
                    </div>
                    <div className="">
                        <ItemTag type={item.getType()!} />
                    </div>
                </div>
                <div className="p-3">
                    <div className="flex ms-5 items-start gap-x-1 text-xs">
                        <Basic
                            text=
                            {
                                `
                                    ${item.getStartDate() ? item.getStartDate() : ""}
                                    ${item.getStartDate() && item.getEndDate() ? "-" : ""} 
                                    ${item.getEndDate() ? item.getEndDate() : ""}
                                    `
                                // ${item.getHours() ? ("(" + item.getHours() + ")") : ""}
                            }
                            fontFamily="font-mono"
                            textColor="text-black"
                            fontSize="sm"
                            other="font-bold"
                            loading={loading}
                            linePulseWidth="w-32"
                        />
                    </div>
                    <div className="ms-3 mt-1 space-y-2 grid-cols-1">
                        {loading ?
                            <MultiLinePulse width="w-62" />
                            :
                            <p key={`${id}-description`} className="text-sm leading-6 text-black">{item.getDescription()![0]}</p>
                        }
                    </div>
                </div>
            </div>
        </div>
    </>
}

const ItemTag = ({ type }: { type: string }) => {
    return <div>
        <div className={`px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap text-black bg-[#E5D9F2]`}>
            {type}
        </div>
    </div>
}

export default RoadmapCard;
