import { Info } from "@/app/models/Info";
import staticData from "@/app/staticData";
import Avatar from "../avatar/avatar";
import { Tags } from "../tags/tags";
import Basic from "../texts/basic";
import HeaderItem from "./headerItem";
import Headline from "./headline";

export default function Header(
    { techs, interpersonalSkills, myInfo, loading = true }:
        {
            techs: string[];
            interpersonalSkills: string[];
            myInfo: Info | undefined,
            loading: boolean;
        }) {
    return <header>
        <div className="blur-[2px] hover:blur-none duration-200">
            <img
                className="rounded-b-2xl brightness-75"
                src={staticData.images.backgrounds.mainBG}
                alt="Image not found"
                style={{
                    width: '100%',
                }}
            />
        </div>
        <div className="absolute -translate-y-[50%] flex justify-center w-full">
            <Avatar image={staticData.images.myImages.face} altText="My face image" ringColor="ring-white" />
        </div>
        <div className="mt-[50px] ms:mt-[10%] lg:flex lg:items-center lg:justify-center ms-10 me-10">
            <div className="min-w-0 flex-1 z-10">
                <Basic text={myInfo?.getName()!} fontSize="text-2xl sm:text-3xl sm:tracking-tight"
                    fontWeight="font-bold" other="leading-7 sm:truncate" loading={loading}
                    linePulseWidth="w-72"
                />
                <div className="mt-2 flex content-center flex-col sm:mt-3 sm:flex-row sm:flex-wrap sm:space-x-6">
                    {
                        myInfo?.getJobTitle() &&
                        <Headline
                            text={myInfo?.getJobTitle()!}
                            icon={staticData.icons.jobIcon}
                            loading={loading}
                            linePulseWidth="w-32"
                        />
                    }
                    {
                        myInfo?.getJobLocation() &&
                        <Headline
                            text={myInfo?.getJobLocation()!}
                            icon={staticData.icons.locationIcon}
                            loading={loading}
                            linePulseWidth="w-32"
                        />
                    }
                </div>
                <div className="mt-4" />
                <Tags id={"techs"}
                    tags={techs} alignH="" bgColor=""
                    loading={loading} wrap={false} />
                <Tags id={"interpersonalSkills"}
                    tags={interpersonalSkills} alignH="" bgColor=""
                    loading={loading} wrap={false} />
            </div>
            <div className="mt-5 flex justify-center lg:ml-4 lg:mt-0 space-x-3 z-10">
                <HeaderItem name="Contact" myRef={"#footer"} />
            </div>
        </div>
    </header>
}