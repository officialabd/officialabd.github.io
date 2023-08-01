import staticData from "@/app/staticData";
import { DetailedListItem } from "./Item";

export default function DetailedList(
    { title, items }: {
        title: string,
        items: Array<DetailedListItem>
    }) {

    return <>
        <div className="py-5 mt-25 sm:py-10">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl lg:mx-0">
                    <h2 className="font-RobotoMono text-[#BFACDF] text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
                </div>
                <div className="mt-4 border-t border-gray-200" />
                <div className="mx-auto mt-4 grid w-full max-w-2xl grid-cols-1 gap-x-8 gap-y-4 lg:max-w-none lg:grid-cols-1">
                    {items.map((item, i) => (
                        <div key={item.getId()}>
                            {i ?
                                <div className="flex justify-center w-full mb-4">
                                    <div className="w-12 border-t border-gray-200" />
                                </div>
                                :
                                <></>
                            }
                            <ListItemNode key={item.getId()} id={item.getId()} item={item} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </>
}

const ListItemNode = (
    { id, item }: { id: any, item: DetailedListItem }
) => {
    return <>
        <div key={id} className="relative py-1 w-full ">
            <div className="relative w-full px-4 py-8 sm:rounded-3xl sm:p-10 bg-clip-padding bg-opacity-60 rounded-xl hover:bg-slate-800/50 hover:shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)] hover:drop-shadow-lg">
                <div className="flex w-full flex-col items-start justify-between">
                    <div className=" items-center gap-x-1 text-xs grid lg:grid-cols-2 sm:grid-cols-1">
                        <time dateTime={item.getStartDate()} className="font-mono">
                            {item.getStartDate()} {item.getStartDate() && item.getEndDate() ? "-" : ""} {item.getEndDate()}
                        </time>
                    </div>
                    <div className="grid w-full sm:grid-cols-1 lg:grid-cols-2">
                        <div>
                            <div className="relative">
                                <h3 className="font-Nunito mt-3 text-teal-400 text-lg font-semibold leading-6">
                                    {item.getTitle()}
                                </h3>
                            </div>
                            <div className="relative mt-2 ms-2 flex items-center gap-x-4">
                                <div className="text-sm leading-6">
                                    <p className="font-SourceCodePro text-slate-500 font-semibold">{item.getSite()}</p>
                                </div>
                            </div>
                            <div className="flex justify-start content-center w-full gap-2 mt-2">
                                {item.getLinks() && item.getLinks()!.map((lk, i) =>
                                    <a
                                        key={`${id}-links-${i}`}
                                        target="_blank"
                                        href={lk[1]}
                                        className="flex relative justify-center items-center max-w-lg z-10 rounded-full px-3 py-1.5 font-medium hover:bg-[#141d32]"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 me-2 text-blue-400">
                                            <path strokeLinecap="round" strokeLinejoin="round" d={staticData.icons.link} />
                                        </svg>
                                        {lk[0]}
                                    </a>
                                )}
                            </div>
                        </div>
                        <div className="mt-4 space-y-2">
                            {item.getDescription() && item.getDescription()!.map((dcp, i) =>
                                <p key={`${id}-description-${i}`} className="line-clamp-3 text-sm leading-6 text-white">{dcp}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap justify-center content-center  w-full gap-2 mt-8">
                        {item.getTags() && item.getTags()!.map((tag, i) =>
                            <Tag id={`${id}-tags-${i}`} name={tag} bgColor="bg-teal-400/10" textColor="text-teal-300" />
                        )}
                    </div>

                </div>
            </div>
        </div>
    </>
}

const Tag = (
    { id, name, bgColor, textColor }: { id: any, name: string, bgColor?: string, textColor?: string }
) => {
    return <>
        <div key={id} id={id} className={`px-3 py-1 rounded-full font-semibold ${bgColor} ${textColor}`}>
            {name}
        </div>
    </>
}