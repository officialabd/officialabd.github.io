import { MouseEventHandler } from "react";
import Basic from "../texts/basic";

// export default function Avatar(image: string, altText: string) {
export default function Avatar(
    {
        image,
        text,
        altText,
        width = 'w-[20%] sm:w-[13%] md:w-[13%] lg:w-[13%] xl:w-[14%]',
        height = 'w-[20%] sm:w-[7%] md:w-[8%] lg:w-[9%] xl:w-[10%]',
        ring = "ring-2",
        ringColor = "ring-white",
        underline = false,
        bgColor = "bg-none",
        padding = "",
        round = "rounded-full",
        display = "",
        letterSpacing = "",
        textColor = "text-white",
        fontFamily = "",
        align = "",
        fontSize = "text-md sm:text-xl",
        fontWeight = "",
        lineColor = "border-gray-200",
        borderWidth = "border-t",
        loading = false,
        other = "",
        linePulseWidth = "w-60",
        linePulsePadding = "py-1",
        linePulseColor = "bg-slate-700",
        linePulseLineHeight = "h-2",
        margin = "",
        onClick = undefined,
    }:
        {
            image: string;
            altText: string;
            text?: string;
            width?: string;
            height?: string;
            ring?: string;
            ringColor?: string;
            SourceCodePro?: string;
            underline?: boolean;
            bgColor?: string;
            padding?: string;
            round?: string;
            textColor?: string;
            display?: string,
            letterSpacing?: string,
            fontFamily?: string,
            align?: string,
            fontSize?: string,
            fontWeight?: string,
            lineColor?: string,
            borderWidth?: string,
            other?: string,
            loading?: boolean,
            linePulseWidth?: string,
            linePulsePadding?: string,
            linePulseColor?: string,
            linePulseLineHeight?: string,
            margin?: string,
            onClick?: MouseEventHandler<HTMLImageElement>
        },
) {
    return (<div>
        <div className="flex justify-center">
            <img
                onClick={onClick}
                className={`${round} ${bgColor} ${padding} ${ring} ${ringColor} ${width} ${height} ${onClick && "hover:cursor-pointer"}`}
                src={image}
                alt={altText}
            />
        </div>
        {text ?
            <>
                <div className="flex mt-3" />
                <Basic
                    display={display}
                    letterSpacing={letterSpacing}
                    text={text}
                    underline={underline}
                    textColor={textColor}
                    fontFamily={fontFamily}
                    align={align}
                    fontSize={fontSize}
                    fontWeight={fontWeight}
                    lineColor={lineColor}
                    borderWidth={borderWidth}
                    loading={loading}
                    other={other}
                    linePulseWidth={linePulseWidth}
                    linePulsePadding={linePulsePadding}
                    linePulseColor={linePulseColor}
                    linePulseLineHeight={linePulseLineHeight}
                    margin={margin}
                />
            </>
            :
            <></>
        }
    </div>
    )
}