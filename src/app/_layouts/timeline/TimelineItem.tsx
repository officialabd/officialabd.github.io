"use client"
import { useScrollAnimation } from "@/app/hooks/useScrollAnimation";
import { ReactNode } from "react";

interface TimelineItemProps {
    children: ReactNode;
    index: number;
}

export default function TimelineItem({ children, index }: TimelineItemProps) {
    const { ref, isVisible } = useScrollAnimation(0.2);

    return (
        <div
            ref={ref}
            className={`relative transition-all duration-700 transform ${isVisible
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 -translate-x-8'
                }`}
            style={{ transitionDelay: `${index * 100}ms` }}
        >
            {/* Content */}
            <div className="ml-16 md:ml-24 mb-12">
                {children}
            </div>
        </div>
    );
}
