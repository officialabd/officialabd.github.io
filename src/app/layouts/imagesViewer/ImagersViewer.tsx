import { MyImageItem } from "@/app/models/Item";
import { useState } from 'react';
import LinePulse from "../pulse/line";

export default function ImagerViewer(
    {
        images, loading = false
    }: {
        images: MyImageItem[] | undefined,
        loading?: boolean
    }) {
    if (!images || images.length === 0) {
        return null; // Return early if images is not provided or empty
    }
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [pulseEffect, setPulseEffect] = useState(true);

    const prevImage = () => {
        setPulseEffect(true);
        setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images?.length!) % images?.length!);
    };

    const nextImage = () => {
        setPulseEffect(true);
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images?.length!);
    };

    return (<div>
        {(loading && images && images.length == 0) ?
            <LinePulse />
            :
            <div className="relative w-full max-w-screen-lg mx-auto">
                <div className={`w-full h-96 relative flex justify-center content-center items-center`}>

                    <div className="rounded-md me-2 w-8 h-12 bg-[#99999944] text-white flex items-center justify-center cursor-pointer hover:bg-opacity-50 transition-opacity"
                        onClick={prevImage}>
                        &lt;
                    </div>
                    <img
                        onLoad={() => { setPulseEffect(false) }}
                        src={images[currentImageIndex]?.url || ''}
                        alt={images[currentImageIndex]?.alt || ''}
                        className={`h-full ${pulseEffect ? "animate-pulse brightness-75" : ""} object-contain border-2 border-black rounded-lg`}
                    />
                    {/* <div className="absolute top-0 left-0 w-full h-full" /> */}
                    <div className="rounded-md ms-2 w-8 h-12 bg-[#99999944] text-white flex items-center justify-center cursor-pointer hover:bg-opacity-50 transition-opacity"
                        onClick={nextImage}>
                        &gt;
                    </div>
                </div>
                <div className="flex justify-center mt-2">
                    {images?.map((image, index) => (
                        <div
                            key={index}
                            className={`w-3 h-3 mx-1 rounded-full cursor-pointer ${index === currentImageIndex ? 'bg-white' : 'bg-gray-400'}`}
                            onClick={() => setCurrentImageIndex(index)}
                        />
                    ))}
                </div>
            </div>
        }
    </div>

    );




    // return <div>
    //     {loading ?
    //         <LinePulse />
    //         :
    //         images?.map(image => {
    //             console.log(image.url);
    //             return <div key={image.name}>
    //                 <MyImage
    //                     src={image.url!}
    //                     alt={image.alt}
    //                 />
    //             </div>
    //         })
    //     }
    // </div>
}

const MyImage = (
    {
        src,
        alt,
        width = "w-full",
        height = "h-full",
        rounded = "",
    }: {
        src: string,
        alt: string,
        width?: string,
        height?: string,
        rounded?: string,
    }) => {

    return <div className={`flex w-full h-full ${rounded}`}>
        <img src={src} alt={alt} width={width} height={height} />
    </div>
}