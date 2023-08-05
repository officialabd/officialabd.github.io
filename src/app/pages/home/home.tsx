"use client"
import DetailedList from "@/app/layouts/detailedList/detailedList";
import Footer from "@/app/layouts/footer/footer";
import Header from "@/app/layouts/header/header";
import { Info } from "@/app/models/Info";
import { DetailedListItem } from "@/app/models/Item";
import staticData from "@/app/staticData";
import { useState } from 'react';
import { fetchMyInfoData, fetchSectionsData, fetchSkillsData } from "./controller";
import Technologies from "./sections/technologies/technologies";

export default function MyHome() {
    const [loading, setLoading] = useState<{
        myInfo: boolean
        skills: boolean,
        internshipsAndCourses: boolean,
        educations: boolean,
        projects: boolean,
    }>({
        myInfo: true,
        skills: true,
        internshipsAndCourses: true,
        educations: true,
        projects: true,
    });
    const [myInfo, setMyInfo] = useState<Info>();
    const [techsSkills, setTechsSkills] = useState<Array<string>>([]);
    const [personalSkills, setPersonalSkills] = useState<Array<string>>([]);
    const [internshipsAndCourses, setInternshipsAndCourses] = useState<Object>([]);
    const [educations, setEducation] = useState<Object>([]);
    const [projects, setProjects] = useState<Object>([]);

    if (loading.myInfo) {
        fetchMyInfoData({
            colName: staticData.firebaseConst.collections.myInfo.name,
            docName: staticData.firebaseConst.collections.myInfo.sub.basic,
            successCallback: (data: any) => {
                setLoading((other) => ({ ...other, myInfo: false }));
                setMyInfo(Info.toInfo(data));
            },
            errorCallback: (error: any) => console.log(error)
        });
    }

    if (loading.skills) {
        fetchSkillsData({
            colName: staticData.firebaseConst.collections.skills.name,
            docName: staticData.firebaseConst.collections.skills.sub.technical,
            successCallback: (data: []) => { setLoading((other) => ({ ...other, skills: false })); setTechsSkills(data); },
            errorCallback: (error: any) => console.log(error)
        });

        fetchSkillsData({
            colName: staticData.firebaseConst.collections.skills.name,
            docName: staticData.firebaseConst.collections.skills.sub.interpersonal,
            successCallback: (data: []) => { setLoading((other) => ({ ...other, skills: false })); setPersonalSkills(data) },
            errorCallback: (error: any) => console.log(error)
        });
    }
    if (loading.educations) {
        fetchSectionsData({
            colName: staticData.firebaseConst.collections.educations,
            successCallback: (data: []) => {
                setLoading((other) => ({ ...other, educations: false }));
                setEducation(DetailedListItem.objectsToItemsList(data))
            },
            errorCallback: (error: any) => console.log(error)
        });
    }
    if (loading.internshipsAndCourses) {
        fetchSectionsData({
            colName: staticData.firebaseConst.collections.internshipsAndCourses,
            successCallback: (data: []) => {
                setLoading((other) => ({ ...other, internshipsAndCourses: false }));
                setInternshipsAndCourses(DetailedListItem.objectsToItemsList(data));
            },
            errorCallback: (error: any) => console.log(error)
        });
    }
    if (loading.projects) {
        fetchSectionsData({
            colName: staticData.firebaseConst.collections.projects,
            successCallback: (data: []) => {
                setLoading((other) => ({ ...other, projects: false }));
                setProjects(DetailedListItem.objectsToItemsList(data));
            },
            errorCallback: (error: any) => console.log(error)
        });
    }


    return <>
        <Header loading={loading.skills}
            myInfo={myInfo!}
            techs={techsSkills}
            interpersonalSkills={personalSkills}
        />
        <div className="mt-10" />
        <div className="flex justify-center">
            <div className="bg-red-200 w-fit text-center text-xl font-bold text-black">
                Demo - Under development
            </div>
        </div>
        <div className="mt-10" />
        <DetailedList title="Internships and Courses" loading={loading.internshipsAndCourses} items={internshipsAndCourses as DetailedListItem[]} />
        <div className="mt-10" />
        <DetailedList title="Education" loading={loading.educations} items={educations as DetailedListItem[]} />
        <div className="mt-10" />
        <DetailedList title="Projects" loading={loading.projects} items={projects as DetailedListItem[]} />
        <div className="mt-10" />
        <Technologies title="Technologies" />
        <div className="mt-10" />
        <Footer id="footer"
            loading={loading.myInfo}
            myInfo={myInfo}
        />
    </>;
}