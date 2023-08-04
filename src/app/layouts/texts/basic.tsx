import LinePulse from "../pulse/line"

export default function Basic(
    {
        text,
        underline = false,
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
    }: {
        text: string,
        underline?: boolean,
        textColor?: string,
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
    }) {
    return <>
        {loading ?
            <LinePulse
                color={linePulseColor}
                lineHeight={linePulseLineHeight}
                padding={linePulsePadding}
                width={linePulseWidth}
            />
            :
            <>
                <div className={`flex tracking-tight ${align} ${fontFamily} ${textColor} ${fontSize} ${fontWeight} ${other}`}>
                    {text}
                </div>
                {underline && <div className={`mt-4 ${lineColor} ${borderWidth}`} />}
            </>
        }
    </>
}