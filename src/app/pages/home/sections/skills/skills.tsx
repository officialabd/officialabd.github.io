import Card from "@/app/layouts/card/card";
import HeadingOne from "@/app/layouts/headings/headingOne";
import staticData from "@/app/staticData";

export default function Skills() {
    const techs = staticData.techniqualSkills;
    const interpersonalSkills = staticData.interpersonalSkills;

    return <Card heading={<HeadingOne text={"Techniqual Skills"} textColor="text-[#BFACDF]" />}>
        <div className="flex flex-wrap mt-4 gap-x-10 gap-y-10 justify-around content-center">
            {/* <LinkedLineList id={"tech-skills"} items={techs} /> */}
            {/* <LinkedLineList id={"personal-skills"} items={interpersonalSkills} /> */}
        </div>
    </Card>
}