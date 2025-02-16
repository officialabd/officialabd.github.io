"use client"
import Footer from "@/app/layouts/footer/footer";
import Roadmap from "@/app/layouts/roadmap/roadmap";
import { Info } from "@/app/models/Info";
import { DetailedListItem } from "@/app/models/Item";
import Constants from "@/app/utilities/Constants";
import { useState } from 'react';
import { fetchImage, fetchMyInfoData, fetchSectionsData, fetchSkillsData } from "./controller";
import Intro from "./sections/intro/intro";
import Technologies from "./sections/technologies/technologies";

export const dynamic = "force-static";

export default function MyHome() {
    const [loading, setLoading] = useState<{
        myInfo: boolean
        skills: boolean,
        courses: boolean,
        educations: boolean,
        projects: boolean,
        experiences: boolean,
    }>({
        myInfo: true,
        skills: true,
        courses: true,
        educations: true,
        projects: true,
        experiences: true,
    });
    const [myInfo, setMyInfo] = useState<Info>();
    const [techsSkills, setTechsSkills] = useState<Array<string>>([]);
    const [personalSkills, setPersonalSkills] = useState<Array<string>>([]);
    const [courses, setCourses] = useState<Object>([]);
    const [educations, setEducation] = useState<Object>([]);
    const [projects, setProjects] = useState<Object>([]);
    const [experiences, setExperiences] = useState<Object>([]);

    if (loading.myInfo) {
        fetchMyInfoData({
            colName: Constants.FIREBASE_CONST.collections.myInfo.name,
            docName: Constants.FIREBASE_CONST.collections.myInfo.sub.basic,
            successCallback: (data: any) => {
                setLoading((other) => ({ ...other, myInfo: false }));
                setMyInfo(Info.toInfo(data));
            },
            errorCallback: (error: any) => console.log(error)
        });
    }

    if (loading.skills) {
        fetchSkillsData({
            colName: Constants.FIREBASE_CONST.collections.skills.name,
            docName: Constants.FIREBASE_CONST.collections.skills.sub.technical,
            successCallback: (data: []) => { setLoading((other) => ({ ...other, skills: false })); setTechsSkills(data); },
            errorCallback: (error: any) => console.log(error)
        });

        fetchSkillsData({
            colName: Constants.FIREBASE_CONST.collections.skills.name,
            docName: Constants.FIREBASE_CONST.collections.skills.sub.interpersonal,
            successCallback: (data: []) => { setLoading((other) => ({ ...other, skills: false })); setPersonalSkills(data) },
            errorCallback: (error: any) => console.log(error)
        });
    }
    if (loading.educations) {
        fetchSectionsData({
            colName: Constants.FIREBASE_CONST.collections.educations,
            successCallback: (data: []) => {
                setLoading((other) => ({ ...other, educations: false }));
                setEducation(DetailedListItem.objectsToItemsList(data, "Education").reverse())
            },
            errorCallback: (error: any) => console.log(error)
        });
    }
    if (loading.courses) {
        fetchSectionsData({
            colName: Constants.FIREBASE_CONST.collections.courses,
            successCallback: (data: []) => {
                setLoading((other) => ({ ...other, courses: false }));
                setCourses(DetailedListItem.objectsToItemsList(data, "Course").reverse());
            },
            errorCallback: (error: any) => console.log(error)
        });
    }

    if (loading.experiences) {
        fetchSectionsData({
            colName: Constants.FIREBASE_CONST.collections.experiences,
            successCallback: (data: []) => {
                setLoading((other) => ({ ...other, experiences: false }));
                setExperiences(DetailedListItem.objectsToItemsList(data, "Experience").reverse());
            },
            errorCallback: (error: any) => console.log(error)
        });
    }

    if (loading.projects) {
        fetchSectionsData({
            colName: Constants.FIREBASE_CONST.collections.projects,
            successCallback: (data: []) => {
                var tempProjects: DetailedListItem[] = DetailedListItem.objectsToItemsList(data, "Project");
                tempProjects.forEach(pt => {
                    const imgsNum = pt.getImages()?.length;
                    pt.getImages()?.forEach((imgItem, i) => {
                        fetchImage({
                            imageRef: imgItem.path!,
                            successCallback: (url: string) => {
                                imgItem.url = url;
                                if ((i + 1) == imgsNum)
                                    setLoading((other) => ({ ...other, projects: false }));

                            },
                            errorCallback: (error: any) => console.log(error)
                        });
                    });
                });
                setProjects(tempProjects);
            },
            errorCallback: (error: any) => console.log(error)
        });
    }


    return <>
        {/* <Header loading={loading.skills}
            myInfo={myInfo!}
            techs={techsSkills}
            interpersonalSkills={personalSkills}
        /> */}
        {/* <div className="mt-14 sm:mt-24" /> */}
        <Intro
            myInfo={myInfo}
            loading={loading.myInfo}
        />
        <div className="mt-14 sm:mt-24" />

        <Roadmap
            id="home"
            title="Timeline" loading={loading.projects || loading.educations || loading.experiences || loading.courses}
            items={
                (projects as DetailedListItem[])
                    .concat(educations as DetailedListItem[])
                    .concat(experiences as DetailedListItem[])
                    .concat(courses as DetailedListItem[])
            }
        />

        <div className="mt-14 sm:mt-24" />
        {/* <DetailedList title="Experience" loading={loading.experiences} items={experiences as DetailedListItem[]} /> */}
        {/* <div className="mt-10" /> */}
        {/* <DetailedList title="Courses" loading={loading.courses} items={courses as DetailedListItem[]} /> */}
        {/* <div className="mt-10" /> */}
        {/* <DetailedList title="Education" loading={loading.educations} items={educations as DetailedListItem[]} /> */}
        {/* <div className="mt-10" /> */}
        {/* <DetailedList title="Projects" loading={loading.projects} items={projects as DetailedListItem[]} /> */}
        {/* <div className="mt-10" /> */}
        <Technologies title="Technologies I have Used in my Professional Life" />
        <div className="mt-10" />
        <Footer id="footer"
            loading={loading.myInfo}
            myInfo={myInfo}
        />
    </>;
}