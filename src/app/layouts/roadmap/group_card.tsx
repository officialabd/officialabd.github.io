import LinePulse from "@/app/_layouts/pulse/line";
import { CardData } from "@/app/models/roadmap/data/CardData";
import { CardDataGroup } from "@/app/models/roadmap/data/CardDataGroup";
import Constants from "@/app/utilities/Constants";
import { useEffect, useRef, useState } from 'react';
import RoadmapCard from "./roadmap_card";

const GroupCard = (
    {
        cardsData,
        loading = false,
    }: {
        cardsData: CardDataGroup,
        loading?: boolean
    }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const [isHovered, setIsHovered] = useState(false);

    if (!cardsData || cardsData.getCardsData().length === 0) {
        return null;
    }

    const prevCard = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + cardsData.getCardsData().length) % cardsData.getCardsData().length);
    };

    const nextCard = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % cardsData.getCardsData().length);
    };

    useEffect(() => {
        if (!isHovered) {
            intervalRef.current = setInterval(() => {
                nextCard();
            }, 4000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isHovered, cardsData.getCardsData().length]);

    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const [touchEndX, setTouchEndX] = useState<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStartX(e.targetTouches[0].clientX); // Get initial touch position
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEndX(e.targetTouches[0].clientX); // Update touch position as the user moves
    };

    const handleTouchEnd = () => {
        if (!touchStartX || !touchEndX) return;

        const swipeDistance = touchStartX - touchEndX;
        const swipeThreshold = 50; // Minimum swipe distance to trigger an action

        if (swipeDistance > swipeThreshold) {
            // Swipe left: show the next card
            nextCard();
        } else if (swipeDistance < -swipeThreshold) {
            // Swipe right: show the previous card
            prevCard();
        }

        // Reset touch positions
        setTouchStartX(null);
        setTouchEndX(null);
    };

    return (<>

        <div
            className="w-full h-full"
            style={{ overflow: "visible", cursor: "pointer" }}
            onClick={() => console.log("Clicked")}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={(e) => handleTouchStart(e)}
            onTouchMove={(e) => handleTouchMove(e)}
            onTouchEnd={() => handleTouchEnd()}
        >
            {loading || !cardsData || cardsData.getCardsData().length == 0 ? (
                <LinePulse />
            ) : (
                <div
                    className="bg-clip-padding bg-opacity-60 rounded-xl shadow-[0px_0px_7px_5px_rgba(0,0,0,0.1)] drop-shadow-lg hover:shadow-[0px_0px_8px_6px_rgba(195,254,244,0.4)] transition-shadow duration-200"
                    style={{ width: '100%', height: '100%' }}
                >
                    <div
                        className="relative overflow-hidden"
                        style={{ width: '100%', height: '100%' }}
                    >
                        <div
                            className="flex transition-transform duration-500 ease-in-out"
                            style={{
                                transform: `translateX(-${currentIndex * 100}%)`,
                                width: '100%', height: '100%'
                            }}
                        >
                            {cardsData.getCardsData().map((card, index) => (
                                card != undefined &&
                                <div
                                    key={index}
                                    className={`${isHovered ? "p-1.5" : ""} bg-[#C9E9D2] rounded-xl transition-all duration-200 flex-shrink-0 w-full min-h-full`}
                                    style={{ width: '100%', height: '100%' }}
                                >
                                    <RoadmapCard
                                        cardData={card}
                                        item={card.getItem()}
                                        title="Demo"
                                        loading={loading}
                                        isGroupItem={true}
                                        isHovered={isHovered}
                                    />
                                </div>
                            ))}
                        </div>

                        {isHovered &&
                            <IndicatorsAndArrows
                                cardsData={cardsData.getCardsData()}
                                prevCard={prevCard}
                                nextCard={nextCard}
                                setCurrentIndex={setCurrentIndex}
                                currentIndex={currentIndex}
                                onHover={setIsHovered}
                            />

                        }

                    </div>
                </div>
            )}
        </div>
    </>);
}

const IndicatorsAndArrows = (
    {
        cardsData,
        prevCard,
        nextCard,
        setCurrentIndex,
        currentIndex,
        onHover
    }: {
        cardsData: Array<CardData>,
        prevCard: Function,
        nextCard: Function,
        setCurrentIndex: Function,
        currentIndex: number,
        onHover: Function
    }) => {
    return (
        <>
            <div
                className="absolute inset-y-1/2 m-auto mx-1 rounded-md w-4 h-12 bg-gray-400/90 hover:bg-gray-950/50 flex items-center justify-center cursor-pointer transition-opacity"
                onClick={() => prevCard()}
                onMouseEnter={() => onHover(true)}
            >
                <img src={Constants.ICONS.arrowBack} className="fill-white" alt="Arrow Back" />
            </div>
            <div
                className="absolute inset-y-1/2 inset-x-full my-auto -mx-5 rounded-md w-4 h-12 bg-gray-400/90 hover:bg-gray-950/50 flex items-center justify-center cursor-pointer transition-opacity"
                onClick={() => nextCard()}
                onMouseEnter={() => onHover(true)}
            >
                <img src={Constants.ICONS.arrowForward} alt="Arrow Forward" />
            </div>
            <div
                className="absolute -inset-x-1/2 m-auto -my-4 flex justify-center"
                onMouseEnter={() => onHover(true)}
            >
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
