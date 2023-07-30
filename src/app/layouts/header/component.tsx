import staticData from "@/app/staticData";
import Avatar from "../circlularImage/comp";

export default function Header() {

    return <header>
        <img
            src={staticData.images.backgrounds.mainBG}
            alt="Image not found"
            style={{
                width: '100%',
                height: '200px',
            }}
        />
        <div className="flex justify-center">
            <Avatar image={staticData.images.myImages.face} altText="My face image" />
        </div>
    </header>
}