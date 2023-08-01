import staticData from "@/app/staticData";


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

export default function Footer() {
    return <>
        <footer className="bg-gradient-to-r from-[#16181c] via-[#1e2127] to-[#16181c]">
            <div className="max-w-screen-xl px-4 py-16 mx-auto sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-8 lg:col-span-3">
                    <div className="flex justify-start ms-7 md:ms-0 md:justify-center">
                        <div>
                            <h4 className="mr-5 h-6 sm:h-9">{staticData.myInfo.name}</h4>
                            <h5 className="ml-2 mt-2 font-mono text-sm h-5 sm:h-7">{staticData.myInfo.title}</h5>
                            <p className="max-w-xs mt-4 text-sm text-gray-500">
                                {staticData.myInfo.note}
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-center mt-8 space-x-6 text-gray-600">
                        <FooterIcon url={staticData.myInfo.links.linkedin} icon={staticData.icons.linkedIn} color="bg-linkedin_bg_color" />
                        <FooterIcon url={staticData.myInfo.links.github} icon={staticData.icons.github} color="bg-github_bg_color" />
                        <FooterIcon url={staticData.myInfo.links.leetcode} icon={staticData.icons.leetcode} color="bg-leetcode_bg_color" />
                    </div>
                    <div className="mt-4 md:mt-0 flex justify-center">
                        <div className="grid grid-cols-2 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-1">
                            <p className="font-medium">
                                Contact
                            </p>
                            <nav className="flex flex-col md:mt-4 space-y-2 text-sm text-gray-500">
                                <a className="hover:opacity-75" target="_blank" href={staticData.myInfo.links.gmail}> {staticData.myInfo.email} </a>
                                <a className="hover:opacity-75" target="_blank" href={staticData.myInfo.links.whatsapp}> {staticData.myInfo.phone} </a>
                            </nav>
                        </div>
                    </div>
                </div>
                <p className="mt-12 text-xs text-center text-gray-100">
                    © 2023 Abd Al-Muttalib's Portfolio
                </p>
            </div>
        </footer>
    </>
}