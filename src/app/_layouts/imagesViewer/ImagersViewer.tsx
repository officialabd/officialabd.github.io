import { MyImageItem } from "@/app/models/Item";
import Constants from "@/app/utilities/Constants";
import { useEffect, useState } from 'react';
import LinePulse from "../pulse/line";

export default function ImagerViewer(
    {
        images, loading = false
    }: {
        images: MyImageItem[] | undefined,
        loading?: boolean
    }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [pulseEffect, setPulseEffect] = useState(false);
    const [imageKey, setImageKey] = useState(0);

    if (!images || images.length === 0) {
        return null;
    }

    // Force re-render when the current image's URL changes
    useEffect(() => {
        const checkInterval = setInterval(() => {
            if (images[currentImageIndex]?.url) {
                setImageKey(prev => prev + 1);
                clearInterval(checkInterval);
            }
        }, 100);

        return () => clearInterval(checkInterval);
    }, [currentImageIndex, images]);

    const prevImage = () => {
        setPulseEffect(true);
        setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images?.length!) % images?.length!);
    };

    const nextImage = () => {
        setPulseEffect(true);
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images?.length!);
    };

    const handleImageLoad = () => {
        setPulseEffect(false);
    };

    const handleImageError = () => {
        setPulseEffect(false);
    };

    return (<div>
        {loading || !images || images.length == 0 ?
            <LinePulse />
            :
            <div className="relative w-full max-w-screen-lg mx-auto">
                <div className={`w-full h-96 relative flex justify-center content-center items-center`}>
                    <div className="rounded-md me-2 w-8 h-12 bg-[#99999988] hover:bg-[#99999955] text-white flex items-center justify-center cursor-pointer hover:bg-opacity-50 transition-opacity"
                        onClick={() => prevImage()}>
                        <img src={Constants.ICONS.arrowBack} className="fill-white" alt="Arrow Back" />
                    </div>
                    {images[currentImageIndex]?.url ? (
                        <img
                            key={imageKey}
                            loading="lazy"
                            onLoad={handleImageLoad}
                            onError={handleImageError}
                            src={images[currentImageIndex].url}
                            alt={images[currentImageIndex]?.alt || ''}
                            className={`h-full ${pulseEffect ? "animate-pulse brightness-75" : ""} object-contain border-2 border-black rounded-lg`}
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center">
                            <LinePulse />
                        </div>
                    )}
                    <div className="rounded-md ms-2 w-8 h-12 bg-[#99999988] hover:bg-[#99999955] text-white flex items-center justify-center cursor-pointer transition-opacity"
                        onClick={() => nextImage()}>
                        <img src={Constants.ICONS.arrowForward} alt="Arrow Forward" />
                    </div>
                </div >
                <div className="flex justify-center mt-2">
                    {images?.map((image, index) => (
                        <div
                            key={index}
                            className={`w-3 h-3 mx-1 rounded-full cursor-pointer ${index === currentImageIndex ? 'bg-white' : 'bg-gray-400 hover:bg-gray-500'}`}
                            onClick={() => setCurrentImageIndex(index)}
                        />
                    ))}
                </div>
            </div >
        }
    </div >

    );
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
        <img src={src} alt={alt} className={`${width} ${height}`} />
    </div>
}