import Avatar from "@/app/layouts/avatar/avatar";
import Card from "@/app/layouts/card/card";
import Basic from "@/app/layouts/texts/basic";
import { Technology } from "@/app/models/Technology";
import staticData from "@/app/staticData";
import { useState } from 'react';
import { fetchTechnologiesData } from "./controller";

export default function Technologies({ title }: { title: string }) {
    const [loading, setLoading] = useState<boolean>(true);
    const [techs, setTechs] = useState<Technology[]>([]);

    if (loading) {
        fetchTechnologiesData({
            colName: staticData.firebaseConst.collections.technologies,
            successCallback: (data: []) => {
                setLoading(false);
                setTechs(Technology.objectsToItemsList(data));
            },
            errorCallback: (error: any) => console.log(error)
        });
    }
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
        <div className="flex flex-wrap mt-4 gap-x-10 gap-y-10 justify-center content-center">
            {techs.map((item, i) => (
                <Avatar key={`Technologies-${i}`}
                    width="w-20" height="h-20"
                    bgColor=""
                    image={`data:image/svg+xml;utf8,${encodeURIComponent(item.getSvgCode()!)}`}
                    altText={`Technologies-${item.getName()}`}
                    text={item.getName()}
                    padding=""
                    ring=""
                    round=""
                    textColor="text-white"
                    align="text-center"
                    fontSize="text-md font-bold tracking-tight sm:text-xl"
                />
            ))}
        </div>
    </Card>
}