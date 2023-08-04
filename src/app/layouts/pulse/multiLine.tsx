export default function MultiLinePulse(
    {
        width = "w-60",
        padding = "py-1",
        color = "bg-slate-700",
        lineHeight = "h-2"
    }: {
        width?: string,
        padding?: string,
        color?: string,
        lineHeight?: string,
    }) {

    return <div className={`${padding} ${width} my-auto`}>
        <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-6 py-1">
                <div className="space-y-3 content-center">
                    <div className={`${lineHeight} ${color} rounded`}></div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className={`${lineHeight} ${color} rounded col-span-1`}></div>
                        <div className={`${lineHeight} ${color} rounded col-span-2`}></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className={`${lineHeight} ${color} rounded col-span-2`}></div>
                        {/* <div className={`${lineHeight} ${color} rounded col-span-1`}></div> */}
                    </div>
                </div>
            </div>
        </div>
    </div>
}