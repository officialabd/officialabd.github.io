"use client"
import { ReactNode, useEffect, useRef, useState } from "react";

interface TimelineSectionProps {
    id: string;
    title: string;
    children: ReactNode;
    showTimeline?: boolean;
}

export default function TimelineSection({ id, title, children, showTimeline = true }: TimelineSectionProps) {
    const sectionRef = useRef<HTMLDivElement>(null);
    const [isSticky, setIsSticky] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0);
            },
            { threshold: [0], rootMargin: '-80px 0px 0px 0px' }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <section id={id} ref={sectionRef} className="relative">
            {/* Sticky Header */}
            <div className={`sticky top-0 z-40 transition-all duration-300 bg-transparent`}>
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white font-RobotoMono tracking-tight">
                        {title}
                    </h2>
                </div>
            </div>

            {/* Timeline Line */}
            <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
                {showTimeline && <div className="absolute left-8 md:left-12 top-0 bottom-0 w-px bg-gradient-to-b from-slate-600 via-slate-700 to-transparent" />}

                {/* Content */}
                <div className="relative py-8">
                    {children}
                </div>
            </div>
        </section>
    );
}
