import staticData from "@/app/staticData";
import { DetailedListItem } from "../../models/Item";
import Card from "../card/card";
import ImagerViewer from "../imagesViewer/ImagersViewer";
import LinePulse from "../pulse/line";
import MultiLinePulse from "../pulse/multiLine";
import { Tags } from "../tags/tags";
import Basic from "../texts/basic";

export default function DetailedList(
    { title, items, loading = false }: { title: string, items: Array<DetailedListItem>, loading?: boolean }) {
    // <div className="">
    return <Card heading={
        <Basic
            text={title}
            textColor="text-[#BFACDF]"
            fontFamily="font-RobotoMono"
            fontSize="text-3xl sm:text-4xl"
            letterSpacing="tracking-tight"
            fontWeight="font-bold"
            margin="mx-auto lg:mx-0"
            underline={true}
            other=""
        />
    }>
        {loading ?
            <ListItemNode key={`temp-loading-${title}`} id={`temp-loading-${title}`} item={new DetailedListItem({})} loading={loading} />
            :
            items.map((item, i) => (
                <div key={item.getId()}>
                    {i ?
                        <div className="flex justify-center w-full mb-4">
                            <div className="w-12 border-t border-gray-200" />
                        </div>
                        :
                        <></>
                    }
                    <ListItemNode key={item.getId()} id={item.getId()} item={item} loading={loading} />
                </div>
            ))}
    </Card>
}

const ListItemNode = (
    { id, item, loading = false }: { id: any, item: DetailedListItem, loading?: boolean }
) => {
    return <>
        <div key={id} className="relative py-1 w-full ">
            {/* <div className="relative w-full px-4 py-8 sm:rounded-3xl sm:p-10 bg-clip-padding bg-opacity-60 rounded-xl hover:bg-slate-800/50 hover:shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)] hover:drop-shadow-lg"> */}
            <div className={`${loading ? "animate-pulse" : ""} relative w-full px-4 py-8 sm:rounded-3xl sm:p-10 bg-clip-padding bg-opacity-60 rounded-xl bg-slate-800/50 shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)] drop-shadow-lg`}>
                <div className="flex w-full flex-col items-start justify-between">
                    <div className={`w-full items-start justify-between grid grid-cols-1 ${(!item.getImages() || item.getImages()?.length == 0) ? "sm:grid-cols-1" : "sm:grid-cols-2"}`}>
                        <div className={`grid grid-cols-1`}>
                            <div className={`grid grid-cols-1 items-center justify-between ${(!item.getImages() || item.getImages()?.length == 0) ? "sm:grid-cols-2" : ""}`}>
                                <div>
                                    <div className="items-center gap-x-1 text-xs">
                                        <Basic
                                            text={`${item.getStartDate() ? item.getStartDate() : ""} ${item.getStartDate() && item.getEndDate() ? "-" : ""} ${item.getEndDate() ? item.getEndDate() : ""}`}
                                            fontFamily="font-mono"
                                            fontSize="sm"
                                            loading={loading}
                                            linePulseWidth="w-32"
                                        />
                                    </div>
                                    <div className="grid w-full grid-cols-1">
                                        <div className="grid-cols-1 sm:grid-cols-1 lg:grid-cols-1">
                                            <div className="relative mt-3">
                                                <Basic text={item.getTitle()!}
                                                    fontFamily="font-Nunito"
                                                    fontSize="text-lg"
                                                    textColor="text-teal-400"
                                                    fontWeight="font-semibold"
                                                    other="leading-6"
                                                    loading={loading}
                                                    linePulseWidth="w-72"
                                                />
                                            </div>
                                            <div className="relative mt-2 ms-2 flex items-center gap-x-4">
                                                <Basic text={item.getSite()!}
                                                    fontFamily="font-SourceCodePro"
                                                    fontSize="text-sm"
                                                    textColor="text-slate-500"
                                                    fontWeight="font-semibold"
                                                    other="leading-6"
                                                    loading={loading}
                                                />
                                            </div>
                                            <div className="flex justify-start content-center w-full gap-2 mt-2">
                                                {loading ?
                                                    <LinePulse width="w-40" />
                                                    :
                                                    item.getLinks() && item.getLinks()!.map((lk, i) =>
                                                        <a
                                                            key={`${id}-links-${i}`}
                                                            target="_blank"
                                                            href={`${Object.entries(lk).at(0)?.[1]}`}
                                                            className="flex text-white relative justify-center items-center max-w-lg z-10 rounded-full px-3 py-1.5 font-medium hover:bg-[#141d32]"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 me-2 text-blue-400">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d={staticData.icons.link} />
                                                            </svg>
                                                            {Object.entries(lk).at(0)?.[0]}
                                                        </a>
                                                    )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-5 space-y-2 grid-cols-1">
                                    {loading ?
                                        <MultiLinePulse width="w-62" />
                                        :
                                        item.getDescription() && item.getDescription()!.map((dcp, i) =>
                                            <p key={`${id}-description-${i}`} className="text-sm leading-6 text-white">{dcp}</p>
                                        )
                                    }
                                </div>
                            </div>
                        </div>
                        {(item.getImages() && item.getImages()?.length! > 0) &&
                            <div className="grid w-full grid-cols-1 mt-10 sm:mt-0">
                                <ImagerViewer
                                    loading={loading}
                                    images={item.getImages()}
                                />
                            </div>
                        }
                    </div>
                    {(loading || item.getTags()) &&
                        <Tags id={id} loading={loading} tags={item.getTags()!} margin="mt-8" gap="gap-2" />
                    }
                </div>
            </div>
        </div>
    </>
}