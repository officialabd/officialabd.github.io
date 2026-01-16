import Avatar from "@/app/_layouts/avatar/avatar";
import Card from "@/app/_layouts/card/card";
import Basic from "@/app/_layouts/texts/basic";
import { Technology } from "@/app/models/Technology";

export default function Technologies({ title, technologies = [], loading = false }: { title: string, technologies?: Technology[], loading?: boolean }) {
    return <Card heading={
        <Basic
            text={title}
            textColor="text-[#BFACDF]"
            fontFamily="font-RobotoMono"
            fontSize="text-3xl sm:text-4xl"
            letterSpacing="tracking-tight"
            fontWeight="font-bold"
            margin="mx-auto lg:mx-0"
            underline={true}
            other=""
        />
    }>
        <div className="flex flex-wrap mt-8 gap-8 justify-center content-center">
            {technologies.map((item, i) => (
                <div
                    key={`Technologies-${i}`}
                    className="group relative flex flex-col items-center transition-all duration-200"
                >
                    {/* Tech Icon Container */}
                    <div className="relative p-4 rounded-lg backdrop-blur-sm bg-slate-800/30 border border-slate-700 transition-all duration-200 group-hover:border-slate-600">
                        <Avatar
                            width="w-16 sm:w-20"
                            height="h-16 sm:h-20"
                            bgColor=""
                            image={`data:image/svg+xml;utf8,${encodeURIComponent(item.getSvgCode()!)}`}
                            altText={`Technologies-${item.getName()}`}
                            text=""
                            padding=""
                            ring=""
                            round=""
                            textColor="text-white"
                            align="text-center"
                            fontSize=""
                        />
                    </div>

                    {/* Tech Name Below Icon */}
                    <span className="mt-3 text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors duration-200">
                        {item.getName()}
                    </span>
                </div>
            ))}
        </div>
    </Card>
}