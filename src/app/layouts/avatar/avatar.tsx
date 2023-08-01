import BasicHeading from "../headings/basic";

// export default function Avatar(image: string, altText: string) {
export default function Avatar(
    {
        image,
        subtitle,
        altText,
        width = 'w-[20%] sm:w-[13%] md:w-[13%] lg:w-[13%] xl:w-[14%]',
        height = 'w-[20%] sm:w-[7%] md:w-[8%] lg:w-[9%] xl:w-[10%]',
        ring = "ring-2",
        ringColor = "white",
        SourceCodePro,
        underline = false,
        bgColor = "bg-none",
        padding = "",
        round = "rounded-full"
    }:
        {
            image: string;
            altText: string;
            subtitle?: string;
            width?: string;
            height?: string;
            ring?: string;
            ringColor?: string;
            SourceCodePro?: string;
            underline?: boolean;
            bgColor?: string;
            padding?: string;
            round?: string
        },
) {
    return (<div>
        <div className="flex justify-center">
            <img
                className={`${round} ${bgColor} ${padding} ${ring} ring-${ringColor} ${width} ${height}`}
                src={image}
                alt={altText}
            />
        </div>
        {subtitle ?
            <>
                <div className="flex mt-3" />
                <BasicHeading text={subtitle} fontFamily={SourceCodePro} underline={underline} />
            </>
            :
            <></>
        }
    </div>
    )
}