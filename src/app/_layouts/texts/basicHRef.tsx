import Basic from "./basic";

export default function BasicHRef(
    {
        display = "",
        letterSpacing = "",
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
        margin = "",
        target = "_blank",
        href = "#",
    }: {
        display?: string,
        letterSpacing?: string,
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
        margin?: string,
        target?: string,
        href: string,
    }) {
    return <a href={href} target={target}>
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
    </a>
}