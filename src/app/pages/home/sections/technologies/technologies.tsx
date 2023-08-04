import Avatar from "@/app/layouts/avatar/avatar";
import Card from "@/app/layouts/card/card";
import HeadingOne from "@/app/layouts/headings/headingOne";
import staticData from "@/app/staticData";

export default function Technologies() {
    const items = staticData.technologies;

    return <Card heading={<HeadingOne text={"Technologies"} textColor="text-[#BFACDF]" />}>
        <div className="flex flex-wrap mt-4 gap-x-10 gap-y-10 justify-center content-center">
            {items.map((item, i) => (
                <Avatar key={`Technologies-${i}`}
                    width="w-20" height="h-20"
                    bgColor=""
                    image={item.path} altText="Technologies"
                    subtitle={item.name}
                    padding=""
                    ring=""
                    round=""
                    textColor="text-white" />
            ))}
        </div>
    </Card>
}