import { useEffect, useRef, useState } from "react";
import staticData from "@/app/staticData";
import { DetailedListItem } from "../../models/Item";
import ImagerViewer from "../imagesViewer/ImagersViewer";
import LinePulse from "../pulse/line";
import MultiLinePulse from "../pulse/multiLine";
import { Tags } from "../tags/tags";
import Basic from "../texts/basic";
import TimelineItem from "../timeline/TimelineItem";

export default function DetailedList(
    { items, loading = false, showDateBadge = true }: { items: Array<DetailedListItem>, loading?: boolean, showDateBadge?: boolean }) {
    return <>
        {loading ?
            <TimelineItem index={0}>
                <ListItemNode key={`temp-loading`} id={`temp-loading`} item={new DetailedListItem({})} loading={loading} showDateBadge={showDateBadge} />
            </TimelineItem>
            :
            items.map((item, i) => (
                <TimelineItem key={item.getId()} index={i}>
                    <ListItemNode id={item.getId()} item={item} loading={loading} showDateBadge={showDateBadge} />
                </TimelineItem>
            ))}
    </>
}

const ListItemNode = (
    { id, item, loading = false, showDateBadge = true }: { id: any, item: DetailedListItem, loading?: boolean, showDateBadge?: boolean }
) => {
    const extractYear = (dateStr: string | undefined): string => {
        if (!dateStr) return "";
        if (dateStr === "Present") return "Present";
        const yearMatch = dateStr.match(/\d{4}/);
        return yearMatch ? yearMatch[0] : dateStr;
    };

    const startYear = extractYear(item.getStartDate());
    const endYear = extractYear(item.getEndDate());
    const dateText = startYear && endYear && startYear !== endYear
        ? `${startYear} - ${endYear}`
        : startYear || endYear;

    return (
        <div key={id} className="relative w-full group">
            {/* Date Badge on Timeline */}
            {showDateBadge && dateText && !loading && (
                <div className="absolute -left-20 md:-left-28 top-8 sm:block">
                    <div className="bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 rounded-md px-2 py-1 text-xs font-mono text-slate-300 whitespace-normal md:whitespace-nowrap text-left max-w-[4.5rem] md:max-w-none">
                        {dateText}
                    </div>
                </div>
            )}

            <div className={`${loading ? "animate-pulse" : ""} relative w-full px-6 py-6 sm:px-8 sm:py-8 rounded-xl bg-slate-800/40 backdrop-blur-sm transition-all duration-300 hover:bg-slate-800/60 border border-slate-700/40 hover:border-slate-600/60 hover:shadow-xl hover:shadow-slate-900/50`}>
                <div className="relative z-10 flex w-full flex-col items-start justify-between">
                    <div className={`w-full items-start justify-between grid grid-cols-1 ${(!item.getImages() || item.getImages()?.length == 0) ? "sm:grid-cols-1" : "sm:grid-cols-2"}`}>
                        <div className={`grid grid-cols-1`}>
                            <div className={`grid grid-cols-1 items-start justify-between ${(!item.getImages() || item.getImages()?.length == 0) ? "sm:grid-cols-2" : ""}`}>
                                <div className="items-start">
                                    <div className="items-start gap-x-1 text-xs">
                                        <Basic
                                            text={`${item.getStartDate() ? item.getStartDate() : ""}
                                                ${item.getStartDate() && item.getEndDate() ? "-" : ""} 
                                                ${item.getEndDate() ? item.getEndDate() : ""}
                                                ${item.getHours() ? ("(" + item.getHours() + ")") : ""}`}
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
                                                    textColor="text-blue-400"
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
                                                    textColor="text-gray-500"
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
                                                            className="flex text-white relative justify-center items-center max-w-lg z-10 rounded px-2 py-1 text-sm font-medium transition-colors duration-200 hover:bg-slate-700 border border-slate-700"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 me-1.5 text-gray-400">
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
                                        item.getDescription() && <ExpandableDescription id={id} descriptions={item.getDescription()!} />
                                    }
                                </div>
                            </div>
                        </div>
                        <div className="items-center grid h-full w-full grid-cols-1 mt-10 sm:mt-0 max-lg:mt-0">
                            {(item.getImages() && item.getImages()?.length! > 0) &&
                                <div className="items-center grid  w-full grid-cols-1 mt-10 sm:mt-0">
                                    <ImagerViewer
                                        loading={loading}
                                        images={item.getImages()}
                                    />
                                </div>
                            }
                        </div>
                    </div>
                    {(loading || item.getTags()) &&
                        <Tags id={id} loading={loading} tags={item.getTags()!} margin="mt-8" gap="gap-2" />
                    }
                </div>
            </div>
        </div>
    );
}

const ExpandableDescription = ({ id, descriptions }: { id: string, descriptions: string[] }) => {
    const [expanded, setExpanded] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const [isClamped, setIsClamped] = useState(false);

    // Check if the content is actually being clamped
    useEffect(() => {
        const el = contentRef.current;
        if (el) {
            setIsClamped(el.scrollHeight > el.clientHeight);
        }
    }, [descriptions]);

    return (
        <>
            <div
                ref={contentRef}
                className={`space-y-2 ${!expanded ? "line-clamp-4 sm:line-clamp-none" : ""}`}
            >
                {descriptions.map((dcp, i) => (
                    <p key={`${id}-description-${i}`} className="text-sm leading-6 text-gray-400">{dcp}</p>
                ))}
            </div>
            {isClamped && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="sm:hidden text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors duration-200 cursor-pointer mt-1"
                >
                    {expanded ? "Show Less" : "Show More"}
                </button>
            )}
        </>
    );
}