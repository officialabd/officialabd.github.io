import { MyImageItem } from "@/app/models/Item";
import staticData from "@/app/staticData";
import { useEffect, useRef, useState } from 'react';
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
    const [containerMinHeight, setContainerMinHeight] = useState<number | undefined>(undefined);
    const [, forceUpdate] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Poll for async URL mutations (URLs are set in-place by parent after fetch)
    useEffect(() => {
        if (!images || !images[currentImageIndex] || images[currentImageIndex]?.url) return;
        const checkInterval = setInterval(() => {
            if (images?.[currentImageIndex]?.url) {
                forceUpdate(n => n + 1);
                clearInterval(checkInterval);
            }
        }, 100);
        return () => clearInterval(checkInterval);
    }, [currentImageIndex, images]);

    if (!images || images.length === 0) {
        return null;
    }

    const lockHeight = () => {
        if (containerRef.current) {
            setContainerMinHeight(containerRef.current.offsetHeight);
        }
    };

    const switchToImage = (index: number) => {
        if (index === currentImageIndex) return;
        lockHeight();
        setPulseEffect(true);
        setCurrentImageIndex(index);
    };

    const prevImage = () => {
        switchToImage((currentImageIndex - 1 + images.length) % images.length);
    };

    const nextImage = () => {
        switchToImage((currentImageIndex + 1) % images.length);
    };

    const handleImageLoad = () => {
        setPulseEffect(false);
        setContainerMinHeight(undefined);
    };

    const handleImageError = () => {
        setPulseEffect(false);
        setContainerMinHeight(undefined);
    };

    return (<div>
        {loading || !images || images.length == 0 ?
            <LinePulse />
            :
            <div className="relative w-full max-w-screen-lg mx-auto">
                <div ref={containerRef} className="w-full relative flex justify-center items-center" style={{ minHeight: containerMinHeight }}>
                    {images[currentImageIndex]?.url ? (
                        <img
                            key={currentImageIndex}
                            onLoad={handleImageLoad}
                            onError={handleImageError}
                            src={images[currentImageIndex].url}
                            alt={images[currentImageIndex]?.alt || ''}
                            className={`max-h-96 max-w-full ${pulseEffect ? "animate-pulse brightness-75" : ""} object-contain border-2 border-black rounded-lg`}
                        />
                    ) : (
                        <div className="h-48 flex items-center justify-center">
                            <LinePulse />
                        </div>
                    )}
                    <div className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 rounded-md w-6 h-8 sm:w-8 sm:h-12 bg-[#99999988] hover:bg-[#99999955] text-white flex items-center justify-center cursor-pointer transition-opacity z-10"
                        onClick={() => prevImage()}>
                        <img src={staticData.icons.arrowBack} className="fill-white" alt="Arrow Back" />
                    </div>
                    <div className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 rounded-md w-6 h-8 sm:w-8 sm:h-12 bg-[#99999988] hover:bg-[#99999955] text-white flex items-center justify-center cursor-pointer transition-opacity z-10"
                        onClick={() => nextImage()}>
                        <img src={staticData.icons.arrowForward} alt="Arrow Forward" />
                    </div>
                </div>
                <div className="flex justify-center mt-2">
                    {images?.map((image, index) => (
                        <div
                            key={index}
                            className={`w-3 h-3 mx-1 rounded-full cursor-pointer ${index === currentImageIndex ? 'bg-white' : 'bg-gray-400 hover:bg-gray-500'}`}
                            onClick={() => switchToImage(index)}
                        />
                    ))}
                </div>
            </div>
        }
    </div>

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