export default function LinePulse(
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
                </div>
            </div>
        </div>
    </div>
}