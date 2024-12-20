// components/RoadmapCard.tsx
'use client';

import MultiLinePulse from "@/app/_components/pulse/multiLine";
import Basic from "@/app/_components/texts/basic";
import { DetailedListItem } from "@/app/models/Item";
import { CardData } from "@/app/models/roadmap/data/CardData";

const RoadmapCard = (
    {
        title,
        item,
        cardData,
        loading = false,
        color
    }: {
        title: string,
        item: DetailedListItem,
        cardData: CardData,
        loading?: boolean
        color: string
    }) => {

    return (
        <>
            <foreignObject className="w-1/4" x="50" y={cardData.getY_c()} height="200">
                {loading ?
                    <ListItemNode key={`temp-loading-${title}`} id={`temp-loading-${title}`} item={new DetailedListItem({})} loading={loading} />
                    :
                    <ListItemNode key={"item.getId()"} id={"item.getId()"} item={item} color={color} loading={loading} />
                }
            </foreignObject>
        </>
    );
};


const ListItemNode = (
    { id, item, color, loading = false }: { id: any, item: DetailedListItem, color?: string, loading?: boolean }
) => {
    return <>
        <div key={id}
            className="bg-clip-padding bg-opacity-60 rounded-xl  shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)] drop-shadow-lg"
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

                <div className=" w-full flex h-10 p-2 items-start justify-between shadow-md content-center bg-[#FEF9F2]">
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
                        <ItemTag type="Project" />
                    </div>
                </div>
                <div className="p-4 py-3">
                    <div className="flex">
                        <div className="items-start gap-x-1 text-xs">
                            <Basic
                                text={`${item.getStartDate() ? item.getStartDate() : ""}
                                                                    ${item.getStartDate() && item.getEndDate() ? "-" : ""} 
                                                                    ${item.getEndDate() ? item.getEndDate() : ""}
                                                                    ${item.getHours() ? ("(" + item.getHours() + ")") : ""}`}
                                fontFamily="font-mono"
                                textColor="text-black"
                                fontSize="sm"
                                other="font-bold"
                                loading={loading}
                                linePulseWidth="w-32"
                            />
                        </div>

                    </div>
                    <div className="mt-2 space-y-2 grid-cols-1">
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
            #{type}
        </div>
    </div>
}

export default RoadmapCard;
