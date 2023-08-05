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
        <footer id={id} key={id} className="bg-gradient-to-r from-[#16181c] via-[#1e2127] to-[#16181c]">
            <div className="max-w-screen-xl px-4 py-16 mx-auto sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-8 lg:col-span-3">
                    <div className="mt-4 md:mt-0 flex justify-center">
                        <div className="grid w-full sm:w-auto justify-center grid-cols-3 sm:grid-cols-2">
                            <div className="grid col-span-1 justify-center sm:justify-normal">
                                <div className="text-white w-[100px] flex justify-start font-bold">
                                    Info
                                </div>
                            </div>
                            <div className="grid col-span-2 sm:mt-4 space-y-2">
                                <Basic
                                    loading={loading}
                                    text={myInfo?.getName()!}
                                    fontSize="text-lg"
                                    textColor="text-white"
                                />
                                <Basic
                                    loading={loading}
                                    text={myInfo?.getTitle()!}
                                    fontSize="text-sm"
                                    fontFamily="font-mono"
                                    textColor="text-white"
                                    margin="ml-2 mt-2"
                                    linePulseWidth="w-32"
                                />
                                <Basic
                                    loading={loading}
                                    text={myInfo?.getNote()!}
                                    fontSize="text-sm"
                                    fontFamily="font-mono"
                                    textColor="text-gray-500"
                                    margin="mt-4"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center mt-8 space-x-6 text-gray-600">
                        <Icon
                            loading={loading}
                            name={myInfo?.getLinks0()?.find((value) => value["name"] === "linkedin")?.name!}
                            bgColor={myInfo?.getLinks0()?.find((value) => value["name"] === "linkedin")?.bgColor!}
                            svgCode={myInfo?.getLinks0()?.find((value) => value["name"] === "linkedin")?.svgCode!}
                            url={myInfo?.getLinks0()?.find((value) => value["name"] === "linkedin")?.link!}
                        />
                        <Icon
                            loading={loading}
                            name={myInfo?.getLinks0()?.find((value) => value["name"] === "github")?.name!}
                            bgColor={myInfo?.getLinks0()?.find((value) => value["name"] === "github")?.bgColor!}
                            svgCode={myInfo?.getLinks0()?.find((value) => value["name"] === "github")?.svgCode!}
                            url={myInfo?.getLinks0()?.find((value) => value["name"] === "github")?.link!}
                        />
                        <Icon
                            loading={loading}
                            name={myInfo?.getLinks0()?.find((value) => value["name"] === "leetcode")?.name!}
                            bgColor={myInfo?.getLinks0()?.find((value) => value["name"] === "leetcode")?.bgColor!}
                            svgCode={myInfo?.getLinks0()?.find((value) => value["name"] === "leetcode")?.svgCode!}
                            url={myInfo?.getLinks0()?.find((value) => value["name"] === "leetcode")?.link!}
                        />
                    </div>
                    <div className="mt-4 md:mt-0 flex justify-center">
                        <div className="grid w-full sm:w-auto justify-center grid-cols-3 sm:grid-cols-2">
                            <div className="grid col-span-1 justify-center sm:justify-normal">
                                <div className="text-white w-[100px] flex justify-start font-bold">
                                    Contact
                                </div>
                            </div>
                            <div className="grid col-span-2 sm:mt-4 text-sm text-gray-500">
                                <BasicHRef
                                    loading={loading}
                                    text={myInfo?.getEmail()!}
                                    href={myInfo?.getLinks()["gmail"]}
                                    fontSize="text-sm"
                                    textColor="text-gray-500"
                                    other="hover:opacity-75"
                                />
                                <BasicHRef
                                    loading={loading}
                                    text={myInfo?.getPhone()!}
                                    href={myInfo?.getLinks()["whatsapp"]}
                                    fontSize="text-sm"
                                    textColor="text-gray-500"
                                    other="hover:opacity-75"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-center">
                    <Basic text={myInfo?.getCopyright()!}
                        fontSize="text-xs"
                        textColor="text-gray-100"
                        margin="mt-12"
                        loading={loading}
                        align="text-center"
                    />
                </div>
            </div>
        </footer>
    </>
}

const FooterIcon = ({ url, color, icon }: { url: string, color: string, icon: string }) => {
    return <>
        <a
            href={url}
            target="_blank"
            type="button"
            data-te-ripple-init
            data-te-ripple-color="light"
            className={`${color} w-11 h-11 mb-2 inline-block rounded-full p-3 text-xs font-medium uppercase leading-normal text-white shadow-md transition duration-150 ease-in-out hover:shadow-slate-400 focus:shadow-lg focus:outline-none focus:ring-0 active:shadow-lg`}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24">
                <path d={icon} />
            </svg>
        </a>
    </>;
}