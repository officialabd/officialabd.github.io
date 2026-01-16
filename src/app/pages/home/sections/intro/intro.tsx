import LinePulse from "@/app/_layouts/pulse/line";
import Basic from "@/app/_layouts/texts/basic";
import { Info } from "@/app/models/Info";
import { Technology } from "@/app/models/Technology";
import { useEffect, useMemo, useState } from "react";

export default function Intro(
    {
        myInfo,
        loading = false,
        technologies = [],
        loadingTechnologies = true,
    }: {
        myInfo: Info | undefined,
        loading?: boolean,
        technologies?: Technology[],
        loadingTechnologies?: boolean,
    }) {

    const [isVisible, setIsVisible] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Generate particle configurations once and memoize them
    // Adjust positioning to keep icons within viewport boundaries even during animation
    const particles = useMemo(() => {
        return [...Array(21)].map((_, i) => {
            const size = Math.random() * 50 + 60; // Size between 60-110px
            // Account for animation movement: translateX (-20px to 10px), translateY (0 to -40px)
            // Also account for icon size in viewport percentage
            const iconSizePercent = 8; // Approximate max icon size as percentage of viewport
            const animationMarginX = 3; // Extra margin for X animation
            const animationMarginY = 5; // Extra margin for Y animation (more due to -40px movement)

            const minLeft = animationMarginX;
            const maxLeft = 100 - iconSizePercent - animationMarginX;
            const minTop = animationMarginY;
            const maxTop = 100 - iconSizePercent - animationMarginY;

            return {
                left: minLeft + Math.random() * (maxLeft - minLeft),
                top: minTop + Math.random() * (maxTop - minTop),
                animationDelay: Math.random() * 5,
                animationDuration: Math.random() * 10 + 10,
                size: size
            };
        });
    }, []);


    useEffect(() => {
        setIsVisible(true);
        setIsMounted(true);
    }, []);

    // return <div className="flex h-screen justify-center content-center items-center">
    return <div className="relative flex h-screen justify-center content-center items-center overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        {isMounted && !loadingTechnologies && technologies.length > 0 && (
            <div className="absolute inset-0 z-0">
                {particles.map((particle, i) => {
                    const tech = technologies[i % technologies.length];
                    return (
                        <div
                            key={i}
                            className="absolute animate-float group"
                            style={{
                                left: particle.left + '%',
                                top: particle.top + '%',
                                animationDelay: particle.animationDelay + 's',
                                animationDuration: particle.animationDuration + 's',
                            }}
                        >
                            <img
                                src={`data:image/svg+xml;utf8,${encodeURIComponent(tech.getSvgCode()!)}`}
                                alt={tech.getName()}
                                className="object-contain opacity-[0.15] w-12 h-12 md:w-16 md:h-16 grayscale invert"
                            />
                        </div>
                    );
                })}
            </div>
        )}

        {loading ?
            <LinePulse />
            :
            <div className="relative z-10 text-center px-4">
                <Basic
                    text={"Hey, I'm Abd"}
                    fontSize="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl"
                    fontFamily="font-Nunito"
                    fontWeight="font-bold"
                    textColor="text-white"
                    margin="mb-4 sm:mb-6 md:mb-8"
                />

                <Basic
                    text={myInfo?.getTitle()!}
                    fontSize="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl"
                    fontFamily="font-Nunito"
                    fontWeight="font-bold"
                    textColor="text-slate-300"
                    margin="mb-6 sm:mb-8 md:mb-10"
                />


                <div className="mt-12 sm:mt-16 md:mt-20 opacity-50">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </div>
            </div>
        }
    </div>
}