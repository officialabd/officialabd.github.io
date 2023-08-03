

const Tags = (
    {
        id,
        tags,
        alignH = "justify-center",
        alignV = "content-center",
        bgColor = "bg-teal-400/10",
        textColor = "text-teal-100",
        margin = "",
        gap = "",
        wrap = true
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
        }) => {

    return <div className="w-full flex content-center">
        {!wrap ? <div className="w-5 bg-gradient-to-r z-10 from-[#101728] via-[#101728] to-[#10172844]" /> : <></>}
        <div className={`w-full flex ${wrap ? "flex-wrap" : "overflow-x-auto no-scrollbar -translate-x-4 pl-4 pr-4"} content-center ${alignH} ${alignV} ${gap} ${margin}`}>
            {
                tags.map((tag, i) => (
                    <Tag key={`${id}-tags-${i}`} id={`${id}-tags-${i}`} name={tag} bgColor={bgColor} textColor={textColor} />
                ))
            }
        </div>
        {!wrap ? <div className="w-5 bg-gradient-to-l -translate-x-8 z-10 from-[#101728] via-[#101728] to-[#10172844]" /> : <></>}
    </div>
}

const Tag = (
    { id, name, bgColor, textColor }: { id: any, name: string, bgColor?: string, textColor?: string }
) => {
    return <div key={id} id={id} className={`px-2 py-1 rounded-full text-xs font-medium leading-5 whitespace-nowrap ${bgColor} ${textColor}`}>
        #{name}
    </div>
}

export { Tag, Tags };

