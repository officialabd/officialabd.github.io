import LinePulse from "@/app/_components/pulse/line";
import { DetailedListItem } from "@/app/models/Item";
import { CardData } from "@/app/models/roadmap/data/CardData";
import Constants from "@/app/utilities/Constants";
import { useEffect, useRef, useState } from 'react';
import RoadmapCard from "./roadmap_card";

function useScreenWidth(): number | null {
    const [screenWidth, setScreenWidth] = useState<number | null>(null);

    useEffect(() => {
        const updateWidth = () => setScreenWidth(window.innerWidth);

        updateWidth();

        window.addEventListener("resize", updateWidth);

        return () => window.removeEventListener("resize", updateWidth);
    }, []);

    return screenWidth;
}

const GroupCard = (
    {
        title,
        items,
        cardsData,
        loading = false,
    }: {
        title: string,
        items: Array<DetailedListItem>,
        cardsData: Array<CardData>,
        loading?: boolean
    }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [pulseEffect, setPulseEffect] = useState(true);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const [isHovered, setIsHovered] = useState(false);

    if (!items || items.length === 0) {
        return null;
    }

    const prevCard = () => {
        setPulseEffect(true);
        setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length);
    };

    const nextCard = () => {
        setPulseEffect(true);
        setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
    };

    useEffect(() => {
        if (!isHovered) {
            intervalRef.current = setInterval(() => {
                nextCard();
            }, 2000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isHovered, items.length]);

    const screenWidth = useScreenWidth();
    const foreignObjectRef = useRef<SVGForeignObjectElement>(null);

    let cardWidth = foreignObjectRef.current?.getBoundingClientRect().width;

    const x = items[0].getTimeline()?.direction === "left"
        ? screenWidth! / 4 - (cardWidth! / 2) + ""
        : (screenWidth! * 3 / 4) - (cardWidth! / 2) + "";

    console.log(cardsData);

    return (<>
        <foreignObject
            ref={foreignObjectRef}
            style={{ overflow: "visible", cursor: "pointer" }}
            onClick={() => console.log("Clicked")}
            width="33%"
            x={x}
            y={cardsData[0].getY_c()}
            height="150"
        >
            {loading || !cardsData || cardsData.length == 0 ? (
                <LinePulse />
            ) : (
                <div
                    className="bg-clip-padding bg-opacity-60 rounded-xl shadow-[0px_0px_7px_5px_rgba(0,0,0,0.1)] drop-shadow-lg hover:shadow-[0px_0px_8px_6px_rgba(195,254,244,0.4)] transition-shadow duration-200"
                    style={{ width: '100%', height: '100%' }}
                >
                    <div
                        className="relative overflow-hidden"
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        style={{ width: '100%', height: '100%' }}
                    >
                        <div
                            className="flex transition-transform duration-500 ease-in-out"
                            style={{
                                transform: `translateX(-${currentIndex * 100}%)`,
                                width: '100%', height: '100%'
                            }}
                        >
                            {cardsData.map((card, index) => (
                                card != undefined &&
                                <div
                                    key={index}
                                    className="flex-shrink-0 w-full min-h-full"
                                    style={{ width: '100%', height: '100%' }}
                                >
                                    <RoadmapCard
                                        cardData={card}
                                        item={items[index]}
                                        title="Demo"
                                        loading={loading}
                                        isGroupItem={true}
                                    />
                                </div>
                            ))}
                        </div>

                        {
                            indicatorsAndArrows(cardsData, prevCard, nextCard, setCurrentIndex, currentIndex)
                        }

                    </div>
                </div>
            )}
        </foreignObject>
    </>);
}

const indicatorsAndArrows = (cardsData: Array<CardData>, prevCard: Function, nextCard: Function, setCurrentIndex: Function, currentIndex: number) => {
    return (
        <>
            <div className="absolute inset-y-1/2 m-auto mx-1 rounded-md w-5 h-12 bg-gray-400/90 hover:bg-gray-950/50 flex items-center justify-center cursor-pointer transition-opacity"
                onClick={() => prevCard()}>
                <img src={Constants.ICONS.arrowBack} className="fill-white" alt="Arrow Back" />
            </div>
            <div className="absolute inset-y-1/2 inset-x-full my-auto -mx-6 rounded-md w-5 h-12 bg-gray-400/90 hover:bg-gray-950/50 flex items-center justify-center cursor-pointer transition-opacity"
                onClick={() => nextCard()}>
                <img src={Constants.ICONS.arrowForward} alt="Arrow Forward" />
            </div>
            <div className="absolute -inset-x-1/2 m-auto -my-4 flex justify-center">
                {cardsData?.map((card, index) => (
                    card != undefined &&
                    <div
                        key={index}
                        className={`w-3 h-3 mx-0.5 rounded-full cursor-pointer ${index === currentIndex ? 'bg-gray-700' : 'bg-gray-400/90 hover:bg-gray-950/50'}`}
                        onClick={() => setCurrentIndex(index)}
                    />
                ))}
            </div>
        </>
    )
}

export default GroupCard;
