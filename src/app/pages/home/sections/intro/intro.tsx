import LinePulse from "@/app/layouts/pulse/line";
import Basic from "@/app/layouts/texts/basic";
import { Info } from "@/app/models/Info";

export default function Intro(
    {
        myInfo,
        loading = false,
    }: {
        myInfo: Info | undefined,
        loading?: boolean,
    }) {

    return <div className="flex justify-center content-center items-center">
        {loading ?
            <LinePulse />
            :
            <div className="mx-auto max-w-4xl px-6 lg:px-8">
                <Basic
                    text={"Hello"}
                    fontSize="text-2xl sm:text-3xl"
                    fontFamily="font-Borel"
                    fontWeight=""
                    textColor="text-purple-200"
                />
                <Basic
                    text={myInfo?.getWhatIMake()!}
                    fontSize="text-5xl sm:text-6xl"
                    fontFamily="font-Nunito"
                    fontWeight=""
                    textColor="text-lime-200"
                    margin="mt-2"
                />
                <Basic
                    text={myInfo?.getDescription()!}
                    fontSize="text-2xl sm:text-3xl"
                    fontFamily="font-Nunito"
                    fontWeight=""
                    margin="mt-2"
                />
            </div>
        }
    </div>
}