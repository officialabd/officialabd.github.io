"use client"
import DetailedList from "@/app/layouts/detailedList/detailedList";
import Footer from "@/app/layouts/footer/footer";
import Header from "@/app/layouts/header/header";
import staticData from "@/app/staticData";

export default function MyHome() {
    return <>
        {/* <div className="bg-[#26282c]"></div> */}
        <Header />
        <div className="mt-20" />
        {/* <Card bgColor="bg-[#17181c]"> */}
        <DetailedList title="Internships and Courses" items={staticData.internshipsAndCourses} />
        {/* </Card> */}
        <div className="mt-20" />
        {/* <Card bgColor="bg-[#17181c]"> */}
        {/* <DetailedList title="Projects" items={staticData.projects} /> */}
        {/* </Card> */}
        <div className="mt-20" />
        <Footer />
    </>;
}