import { useState } from "react";
import LinePulse from "../pulse/line";


const Tags = (
    {
        id,
        tags,
        alignH = "justify-center",
        alignV = "content-center",
        bgColor = "bg-teal-400/10",
        textColor = "text-slate-200",
        margin = "",
        gap = "",
        wrap = true,
        loading = false,
    }:
        {
            id: string;
            tags: Array<string>;
            alignH?: string;
            alignV?: string;
            bgColor?: string;
            textColor?: string;
            margin?: string;
            gap?: string;
            wrap?: boolean
            loading?: boolean
        }) => {

    const [showAllMobile, setShowAllMobile] = useState(false);
    const shouldLimitOnMobile = tags && tags.length > 3;
    const displayedTags = showAllMobile ? tags : tags?.slice(0, 3);

    return <div className="w-full flex flex-col content-center justify-center">
        <div className="w-full flex content-center justify-center">
            {!wrap ? <div className="w-5 bg-gradient-to-r z-10 from-[var(--background-my-color)] via-[var(--background-my-color)] to-[var(--background-my-color-faded)]" /> : <></>}
            <div className={`w-full flex ${wrap ? "flex-wrap" : "overflow-x-auto no-scrollbar -translate-x-4 pl-4 pr-4"} content-center ${alignH} ${alignV} ${gap} ${margin}`}>
                {loading ?
                    <LinePulse />
                    :
                    <>
                        {/* Mobile: Show limited or all tags */}
                        <div className="flex flex-wrap content-center justify-center gap-2 md:hidden w-full">
                            {displayedTags?.map((tag, i) => (
                                <Tag key={`${id}-tags-${i}`} id={`${id}-tags-${i}`} name={tag} bgColor={bgColor} textColor={textColor} loading={false} />
                            ))}
                        </div>
                        {/* Desktop: Show all tags */}
                        <div className="hidden md:flex flex-wrap content-center justify-center gap-2 w-full">
                            {tags?.map((tag, i) => (
                                <Tag key={`${id}-tags-${i}`} id={`${id}-tags-${i}`} name={tag} bgColor={bgColor} textColor={textColor} loading={false} />
                            ))}
                        </div>
                    </>
                }
            </div>
            {!wrap ? <div className="w-5 bg-gradient-to-l -translate-x-8 z-10 from-[var(--background-my-color)] via-[var(--background-my-color)] to-[var(--background-my-color-faded)]" /> : <></>}
        </div>
        {/* Show More button - only on mobile when there are more than 3 tags */}
        {!loading && shouldLimitOnMobile && (
            <button
                onClick={() => setShowAllMobile(!showAllMobile)}
                className="md:hidden mt-3 text-sm text-slate-400 hover:text-slate-300 transition-colors duration-200 font-medium"
            >
                {showAllMobile ? "Show Less" : `Show More (${tags.length - 3})`}
            </button>
        )}
    </div>
}

const Tag = (
    { id, name, bgColor, textColor, loading = false }: { id: any, name: string, bgColor?: string, textColor?: string, loading?: boolean }
) => {
    return <>{loading ?
        <div className="max-w-sm w-[100%]">
            <div className="w-[100%]">
                <div className="animate-pulse flex space-x-4">
                    <div className="flex-1 space-y-6 py-1">
                        <div className="space-y-3">
                            <div className="h-2 bg-slate-700 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div> :
        <div key={id} id={id} className={`px-2.5 py-1 rounded text-xs font-medium leading-5 whitespace-nowrap ${bgColor} ${textColor} border border-slate-700 transition-colors duration-200 hover:border-slate-600`}>
            #{name}
        </div>}
    </>;
}

export { Tag, Tags };

