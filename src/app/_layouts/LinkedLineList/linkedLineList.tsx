
export default function LinkedLineList(
    {
        id,
        items,
        lineColor = "bg-indigo-600",
        lineWidth = "w-2",
        lineHeight = "h-full",
        circlesWidth = "w-4",
        circlesHeight = "h-4",
    }: {
        id: string;
        items: Array<{ name: string }>;
        lineColor?: string;
        lineWidth?: string;
        lineHeight?: string;
        circlesWidth?: string;
        circlesHeight?: string;
    }) {
    // const items = staticData.techniqualSkills;

    return <div className=" px-4 py-8 sm:rounded-3xl sm:p-10 bg-clip-padding bg-opacity-60 rounded-xl bg-slate-800/50 shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)] drop-shadow-lg">
        {items.map((item, i) => (
            <div key={`llList-${id}-${i}`}>
                <div className="grid grid-cols-4">
                    <div className="grid col-span-1">
                        <div className={`${lineHeight} ${lineWidth} ${lineColor} relative ${i == 0 ? "rounded-t-full" : ""} ${i == (items.length - 1) ? "rounded-b-full" : ""}`}>
                            <div className={`${circlesHeight} ${circlesWidth} ${lineColor} rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2`}></div>
                        </div>
                    </div>
                    <div className="grid py-3 col-span-3 content-center justify-start">
                        {item.name}
                    </div>
                </div>
            </div>
        ))}
    </div>
}