import { useEffect, useState } from "react";
import Constants from "./Constants";

function isBounded(date: Date, startDate: Date, endDate: Date) {
    return (date.getTime() >= startDate.getTime()) && (date.getTime() <= endDate.getTime())
}

function toDate(date: string, backupDate: string = new Date().toDateString()) {
    if (date == "Present")
        return new Date();

    if (date == "" || date == undefined) {
        const backup = new Date(backupDate);
        return new Date(backup.getFullYear(), backup.getMonth(), 31);
    }

    return new Date(date);
}

function calculateDifferenceAsLength(startDate: Date, endDate: Date) {
    const diffInMs: number = Math.abs(endDate.getTime() - startDate.getTime());
    const diffInDays: number = diffInMs / (1000 * 60 * 60 * 24);

    const length: number = Math.ceil(diffInDays * Constants.ROADMAP_CONFIGS.DAY_ROAD_LENGTH);

    return length;
}

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

const Utilities = {
    isBounded,
    toDate,
    calculateDifferenceAsLength,
    useScreenWidth
}

export default Utilities;