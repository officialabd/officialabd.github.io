import staticData from "@/app/staticData";
import Avatar from "../avatar/avatar";
import { Tags } from "../tags/tags";
import HeaderItem from "./headerItem";
import Headline from "./headline";

export default function Header() {
    const techs = staticData.techniqualSkills;
    const interpersonalSkills = staticData.interpersonalSkills;
    return <header>
        <div className="blur-[2px] hover:blur-none duration-200">
            <img
                className="rounded-b-2xl brightness-75"
                src={staticData.images.backgrounds.mainBG}
                alt="Image not found"
                style={{
                    width: '100%',
                    // height: '200px',
                }}
            />
        </div>
        <div className="absolute -translate-y-[50%] flex justify-center w-full">
            <Avatar image={staticData.images.myImages.face} altText="My face image" ringColor="ring-white" />
        </div>
        <div className="mt-[50px] ms:mt-[10%] lg:flex lg:items-center lg:justify-center ms-10 me-10">
            <div className="min-w-0 flex-1 z-10">
                <h2 className="text-2xl font-bold leading-7 sm:truncate sm:text-3xl sm:tracking-tight">
                    {staticData.myInfo.name}
                </h2>
                <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
                    <Headline
                        text="Quality Assurance Engineer | Frontend developer"
                        icon={staticData.icons.jobIcon}
                    />
                    <Headline
                        text="Remote / On-site"
                        icon={staticData.icons.locationIcon}
                    />
                </div>
                <div className="mt-4" />
                <Tags id={"header"} tags={techs} alignH="" bgColor="" wrap={false} />
                <Tags id={"header"} tags={interpersonalSkills} alignH="" bgColor="" wrap={false} />
            </div>
            <div className="mt-5 flex justify-center lg:ml-4 lg:mt-0 space-x-3 z-10">
                <HeaderItem name="Projects" myRef={staticData.routes.projects} />
                <HeaderItem name="Contact" myRef={"#footer"} />
            </div>
        </div>
    </header>
}