"use client"
import DetailedList from "@/app/_layouts/detailedList/detailedList";
import Footer from "@/app/_layouts/footer/footer";
import { Info } from "@/app/models/Info";
import { DetailedListItem } from "@/app/models/Item";
import { Technology } from "@/app/models/Technology";
import staticData from "@/app/staticData";
import { useState } from 'react';
import { fetchImage, fetchMyInfoData, fetchSectionsData, fetchSkillsData } from "./controller";
import Intro from "./sections/intro/intro";
import Technologies from "./sections/technologies/technologies";
import { useScrollAnimation } from "@/app/hooks/useScrollAnimation";
import { fetchTechnologiesData } from "./sections/technologies/controller";
import Header from "@/app/_layouts/header/header";

function sortItems(items: DetailedListItem[]): DetailedListItem[] {
    return items.sort((a, b) => {
        const endDateA = a.getEndDate();
        const endDateB = b.getEndDate();

        if (endDateA === "Present") return -1;
        if (endDateB === "Present") return 1;

        if (endDateA === undefined && endDateB === undefined) {
            const startDateA = a.getStartDate();
            const startDateB = b.getStartDate();

            if (startDateA === undefined && startDateB === undefined) return 0;
            if (startDateA === undefined) return 1;
            if (startDateB === undefined) return -1;

            return new Date(startDateB).getTime() - new Date(startDateA).getTime();
        }

        if (endDateA === undefined) return 1;
        if (endDateB === undefined) return -1;

        return new Date(endDateB).getTime() - new Date(endDateA).getTime();
    });
}

export default function MyHome() {
    const [loading, setLoading] = useState<{
        myInfo: boolean
        skills: boolean,
        courses: boolean,
        educations: boolean,
        projects: boolean,
        experiences: boolean,
        technologies: boolean,
    }>({
        myInfo: true,
        skills: true,
        courses: true,
        educations: true,
        projects: true,
        experiences: true,
        technologies: true,
    });
    const [myInfo, setMyInfo] = useState<Info>();
    const [techsSkills, setTechsSkills] = useState<Array<string>>([]);
    const [personalSkills, setPersonalSkills] = useState<Array<string>>([]);
    const [courses, setCourses] = useState<Object>([]);
    const [educations, setEducation] = useState<Object>([]);
    const [projects, setProjects] = useState<Object>([]);
    const [experiences, setExperiences] = useState<Object>([]);
    const [technologies, setTechnologies] = useState<Technology[]>([]);
    // writeCollection({ collectionName: "myInfo", docName: "basic", object: staticData.myInfo });
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
            successCallback: (data: []) => {
                setLoading((other) => ({ ...other, skills: false }));
                setTechsSkills(data);
            },
            errorCallback: (error: any) => console.log(error)
        });

        fetchSkillsData({
            colName: staticData.firebaseConst.collections.skills.name,
            docName: staticData.firebaseConst.collections.skills.sub.interpersonal,
            successCallback: (data: []) => {
                setLoading((other) => ({ ...other, skills: false }));
                setPersonalSkills(data)
            },
            errorCallback: (error: any) => console.log(error)
        });
    }
    if (loading.educations) {
        fetchSectionsData({
            colName: staticData.firebaseConst.collections.educations,
            successCallback: (data: []) => {
                setLoading((other) => ({ ...other, educations: false }));
                setEducation(sortItems(DetailedListItem.objectsToItemsList(data)))
            },
            errorCallback: (error: any) => console.log(error)
        });
    }
    if (loading.courses) {
        fetchSectionsData({
            colName: staticData.firebaseConst.collections.courses,
            successCallback: (data: []) => {
                setLoading((other) => ({ ...other, courses: false }));
                setCourses(sortItems(DetailedListItem.objectsToItemsList(data)));
            },
            errorCallback: (error: any) => console.log(error)
        });
    }

    if (loading.experiences) {
        fetchSectionsData({
            colName: staticData.firebaseConst.collections.experiences,
            successCallback: (data: []) => {
                setLoading((other) => ({ ...other, experiences: false }));
                setExperiences(sortItems(DetailedListItem.objectsToItemsList(data)));
            },
            errorCallback: (error: any) => console.log(error)
        });
    }

    if (loading.projects) {
        fetchSectionsData({
            colName: staticData.firebaseConst.collections.projects,
            successCallback: (data: []) => {
                var tempProjects: DetailedListItem[] = sortItems(DetailedListItem.objectsToItemsList(data));
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

    if (loading.technologies) {
        fetchTechnologiesData({
            colName: staticData.firebaseConst.collections.technologies,
            successCallback: (data: []) => {
                setLoading((other) => ({ ...other, technologies: false }));
                setTechnologies(Technology.objectsToItemsList(data));
            },
            errorCallback: (error: any) => console.log(error)
        });
    }


    return <>
        <Intro
            myInfo={myInfo}
            loading={loading.myInfo}
            technologies={technologies}
            loadingTechnologies={loading.technologies}
        />

        <AnimatedSection delay={10}>
            <div className="mt-14 sm:mt-24" />
            <DetailedList title="Experience" loading={loading.experiences} items={experiences as DetailedListItem[]} />
        </AnimatedSection>

        <AnimatedSection delay={10}>
            <div className="mt-10" />
            <DetailedList title="Courses" loading={loading.courses} items={courses as DetailedListItem[]} />
        </AnimatedSection>

        <AnimatedSection delay={10}>
            <div className="mt-10" />
            <DetailedList title="Education" loading={loading.educations} items={educations as DetailedListItem[]} />
        </AnimatedSection>

        <AnimatedSection delay={10}>
            <div className="mt-10" />
            <DetailedList title="Projects" loading={loading.projects} items={projects as DetailedListItem[]} />
        </AnimatedSection>

        <AnimatedSection delay={10}>
            <div className="mt-10" />
            <Technologies title="Technologies" technologies={technologies} loading={loading.technologies} />
        </AnimatedSection>

        <div className="mt-10" />
        <Footer id="footer" loading={loading.myInfo} myInfo={myInfo} />
    </>;
}

function AnimatedSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
    const { ref, isVisible } = useScrollAnimation(0.1);

    return (
        <div
            ref={ref}
            className={`transition-all duration-700 transform ${isVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-10'
                }`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}