import { Info } from "@/app/models/Info";
import Icon from "../icon/icon";
import Basic from "../texts/basic";
import BasicHRef from "../texts/basicHRef";


export default function Footer(
    {
        id,
        loading = false,
        myInfo = undefined,
    }: {
        id: string,
        loading?: boolean,
        myInfo: Info | undefined,
    }) {

    return <>
        <footer id={id} key={id} className="relative bg-slate-900 border-t border-slate-800">

            <div className="relative z-10 max-w-screen-xl px-4 py-16 mx-auto sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-8 lg:col-span-3">
                    <div className="mt-4 md:mt-0 flex justify-center">
                        <div className="grid w-full sm:w-auto justify-center grid-cols-3 sm:grid-cols-2">
                            <div className="grid col-span-1 justify-center sm:justify-normal">
                                <div className="text-white w-[100px] flex justify-start font-semibold text-sm">
                                    Info
                                </div>
                            </div>
                            <div className="grid col-span-2 sm:mt-4 space-y-3">
                                <Basic
                                    loading={loading}
                                    text={myInfo?.getName()!}
                                    fontSize="text-base"
                                    textColor="text-gray-300"
                                    fontWeight="font-medium"
                                />
                                <Basic
                                    loading={loading}
                                    text={myInfo?.getWhatIMake()!}
                                    fontSize="text-sm"
                                    fontFamily="font-mono"
                                    textColor="text-gray-500"
                                    margin="ml-2 mt-2"
                                    linePulseWidth="w-32"
                                />
                                <Basic
                                    loading={loading}
                                    text={myInfo?.getNote()!}
                                    fontSize="text-sm"
                                    fontFamily="font-mono"
                                    textColor="text-gray-600"
                                    margin="mt-4"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center items-center mt-8 space-x-6 text-gray-600">
                        <div className="flex space-x-4">
                            <div className="transition-all duration-200 hover:opacity-70">
                                <Icon
                                    loading={loading}
                                    name={myInfo?.getLinks0()?.find((value) => value["name"] === "linkedin")?.name!}
                                    bgColor={myInfo?.getLinks0()?.find((value) => value["name"] === "linkedin")?.bgColor!}
                                    svgCode={myInfo?.getLinks0()?.find((value) => value["name"] === "linkedin")?.svgCode!}
                                    url={myInfo?.getLinks0()?.find((value) => value["name"] === "linkedin")?.link!}
                                />
                            </div>
                            <div className="transition-all duration-200 hover:opacity-70">
                                <Icon
                                    loading={loading}
                                    name={myInfo?.getLinks0()?.find((value) => value["name"] === "github")?.name!}
                                    bgColor={myInfo?.getLinks0()?.find((value) => value["name"] === "github")?.bgColor!}
                                    svgCode={myInfo?.getLinks0()?.find((value) => value["name"] === "github")?.svgCode!}
                                    url={myInfo?.getLinks0()?.find((value) => value["name"] === "github")?.link!}
                                />
                            </div>
                            <div className="transition-all duration-200 hover:opacity-70">
                                <Icon
                                    loading={loading}
                                    name={myInfo?.getLinks0()?.find((value) => value["name"] === "leetcode")?.name!}
                                    bgColor={myInfo?.getLinks0()?.find((value) => value["name"] === "leetcode")?.bgColor!}
                                    svgCode={myInfo?.getLinks0()?.find((value) => value["name"] === "leetcode")?.svgCode!}
                                    url={myInfo?.getLinks0()?.find((value) => value["name"] === "leetcode")?.link!}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 md:mt-0 flex justify-center">
                        <div className="grid w-full sm:w-auto justify-center grid-cols-3 sm:grid-cols-2">
                            <div className="grid col-span-1 justify-center sm:justify-normal">
                                <div className="text-white w-[100px] flex justify-start font-semibold text-sm">
                                    Contact
                                </div>
                            </div>
                            <div className="grid col-span-2 sm:mt-4 text-sm text-gray-500 space-y-2">
                                <BasicHRef
                                    loading={loading}
                                    text={myInfo?.getEmail()!}
                                    href={myInfo?.getLinks()["gmail"]}
                                    fontSize="text-sm"
                                    textColor="text-gray-500 hover:text-gray-400"
                                    other="transition-colors duration-200"
                                />
                                <BasicHRef
                                    loading={loading}
                                    text={myInfo?.getPhone()!}
                                    href={myInfo?.getLinks()["whatsapp"]}
                                    fontSize="text-sm"
                                    textColor="text-gray-500 hover:text-gray-400"
                                    other="transition-colors duration-200"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-center mt-12">
                    <div className="text-center space-y-2">
                        <div className="h-px w-48 mx-auto bg-slate-800 mb-4"></div>
                        <Basic text={myInfo?.getCopyright()!}
                            fontSize="text-xs"
                            textColor="text-gray-600"
                            loading={loading}
                            align="text-center"
                        />
                    </div>
                </div>
            </div>
        </footer>
    </>
}