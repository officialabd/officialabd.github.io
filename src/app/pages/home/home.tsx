"use client"
import DetailedList from "@/app/layouts/detailedList/detailedList";
import Footer from "@/app/layouts/footer/footer";
import Header from "@/app/layouts/header/header";
import staticData from "@/app/staticData";
import Technologies from "./sections/technologies/technologies";

export default function MyHome() {
    return <>
        <Header />
        <div className="mt-10" />
        <div className="flex justify-center">
            <div className="bg-red-200 w-fit text-center text-xl font-bold text-black">
                Demo - Under development
            </div>
        </div>
        <DetailedList title="Internships and Courses" items={staticData.internshipsAndCourses} />
        <div className="mt-10" />
        <DetailedList title="Education" items={staticData.educations} />
        <div className="mt-10" />
        <DetailedList title="Projects" items={staticData.projects} />
        <div className="mt-10" />
        <Technologies />
        <div className="mt-10" />
        <Footer id="footer" />
    </>;
}