import staticData from "@/app/staticData";
import { DetailedListItem } from "./Item";


const ListItemNode = (
    { id, item }: { id: any, item: DetailedListItem }
) => {
    return <>
        <div key={id} className="relative py-1 w-full ">
            <div className="relative w-full px-4 py-8 bg-[#1C2136] shadow-lg sm:rounded-3xl sm:p-10 bg-clip-padding bg-opacity-60 rounded-xl backdrop-blur-md ">
                <div className="">
                    <div className="flex w-full flex-col items-start justify-between">
                        <div className=" items-center gap-x-1 text-xs grid lg:grid-cols-2 sm:grid-cols-1">
                            <time dateTime={item.getStartDate()} className="">
                                {item.getStartDate()} - {item.getEndDate()}
                            </time>
                        </div>
                        <div className="grid w-full sm:grid-cols-1 lg:grid-cols-2">
                            <div>
                                <div className="group relative">
                                    <h3 className="mt-3 text-lg font-semibold leading-6">
                                        {item.getTitle()}
                                    </h3>
                                </div>
                                <div className="relative mt-2 ms-2 flex items-center gap-x-4">
                                    <div className="text-sm leading-6">
                                        <p className="font-semibold">{item.getSite()}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 space-y-2">
                                {item.getDescription() && item.getDescription()!.map((dcp, i) =>
                                    <p key={`${id}-description-${i}`} className="line-clamp-3 text-sm leading-6 text-white">{dcp}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-center content-center w-full gap-2 mt-8">
                            {item.getLinks() && item.getLinks()!.map((lk, i) =>
                                <a
                                    key={`${id}-links-${i}`}
                                    target="_blank"
                                    href={lk[1]}
                                    className="flex relative max-w-lg z-10 rounded-full px-3 py-1.5 font-medium bg-slate-400 text-black hover:bg-slate-500"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 me-1 text-blue-700">
                                        <path strokeLinecap="round" strokeLinejoin="round" d={staticData.icons.link} />
                                    </svg>

                                    {lk[0]}
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </>
}


export default function DetailedList(
    { title, items }: {
        title: string,
        items: Array<DetailedListItem>
    }) {

    return <>
        <div className="py-5 mt-25 sm:py-10">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl lg:mx-0">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
                </div>
                <div className="mt-4 border-t border-gray-200" />
                <div className="mx-auto mt-4 grid w-full max-w-2xl grid-cols-1 gap-x-8 gap-y-4 lg:max-w-none lg:grid-cols-1">
                    {items.map((item) => (
                        <ListItemNode key={item.getId()} id={item.getId()} item={item} />
                    ))}
                </div>
            </div>
        </div>
    </>
}