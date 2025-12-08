import LinePulse from "../pulse/line";

export default function Headline(
    { text, icon, loading = false,
        other = "",
        linePulseWidth = "w-60",
        linePulsePadding = "py-1",
        linePulseColor = "bg-slate-700",
        linePulseLineHeight = "h-2",
    }:
        {
            text: string,
            icon: string,
            loading?: boolean,
            other?: string,
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
            <div className={`mt-auto flex content-center items-center text-sm text-gray-500 ${other}`}>
                <svg className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" >
                    <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                </svg>
                {text}
            </div>}
    </>
}