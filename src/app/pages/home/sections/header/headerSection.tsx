"use client"
import Header from "@/app/layouts/header/header";
import { Info } from "@/app/models/Info";
import staticData from "@/app/staticData";
import { useState } from 'react';
import { fetchSkillsData } from "../../controller";

export default function HeaderSection(
    {
        loading = false,
        myInfo,
    }: {
        loading: boolean,
        myInfo: Info | undefined,
    }
) {
    const [skillsLoading, setSkillsLoading] = useState<boolean>(true);
    const [techsSkills, setTechsSkills] = useState<Array<string>>([]);
    const [personalSkills, setPersonalSkills] = useState<Array<string>>([]);


    if (skillsLoading) {
        fetchSkillsData({
            colName: staticData.firebaseConst.collections.skills.name,
            docName: staticData.firebaseConst.collections.skills.sub.technical,
            successCallback: (data: []) => {
                setSkillsLoading(false);
                setTechsSkills(data);
            },
            errorCallback: (error: any) => console.log(error)
        });

        fetchSkillsData({
            colName: staticData.firebaseConst.collections.skills.name,
            docName: staticData.firebaseConst.collections.skills.sub.interpersonal,
            successCallback: (data: []) => {
                setSkillsLoading(false);
                setPersonalSkills(data)
            },
            errorCallback: (error: any) => console.log(error)
        });
    }

    return <>
        <Header loading={skillsLoading || loading}
            myInfo={myInfo!}
            techs={techsSkills}
            interpersonalSkills={personalSkills}
        />
    </>;
}