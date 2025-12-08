export default function CirclePulse(
    {
        width = "",
        padding = "py-1",
        color = "bg-slate-700",
        radius = ""
    }: {
        width?: string,
        padding?: string,
        color?: string,
        radius?: string,
    }) {

    return <div className={`${padding} ${width} my-auto`}>
        <div className="animate-pulse flex">
            <div className="flex-1 space-y-6 py-1">
                <div className={`${radius} ${color} rounded-full h-10 w-10`} />
            </div>
        </div>
    </div>
}

