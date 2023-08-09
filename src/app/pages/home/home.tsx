"use client"
import Footer from "@/app/layouts/footer/footer";
import { Info } from "@/app/models/Info";
import staticData from "@/app/staticData";
import { useState } from 'react';
import { fetchMyInfoData } from "./controller";
import HeaderSection from "./sections/header/headerSection";
import Intro from "./sections/intro/intro";
import Section from "./sections/listSection/section";
import Technologies from "./sections/technologies/technologies";

export default function MyHome() {
    const [loadingMyInfo, setLoadingMyInfo] = useState<boolean>(true);
    const [myInfo, setMyInfo] = useState<Info>();
    if (loadingMyInfo) {
        fetchMyInfoData({
            colName: staticData.firebaseConst.collections.myInfo.name,
            docName: staticData.firebaseConst.collections.myInfo.sub.basic,
            successCallback: (data: any) => {
                setLoadingMyInfo(false);
                setMyInfo(Info.toInfo(data));
            },
            errorCallback: (error: any) => console.log(error)
        });
    }

    return <>
        <HeaderSection
            myInfo={myInfo}
            loading={loadingMyInfo}
        />
        <div className="mt-14 sm:mt-24" />
        <Intro
            myInfo={myInfo}
            loading={loadingMyInfo}
        />
        <div className="mt-14 sm:mt-24" />
        <Section
            title="Internships and Courses"
            collectionName={staticData.firebaseConst.collections.internshipsAndCourses}
        />
        <div className="mt-10" />
        <Section
            title="Education"
            collectionName={staticData.firebaseConst.collections.educations}
        />
        <div className="mt-10" />
        <Section
            title="Projects"
            collectionName={staticData.firebaseConst.collections.projects}
        />
        <div className="mt-10" />
        <Technologies title="Technologies" />
        <div className="mt-10" />
        <Footer id="footer"
            loading={loadingMyInfo}
            myInfo={myInfo}
        />
    </>;
}