import { ReactNode } from "react";

export default function Card(
    { children, bgColor }: { children: ReactNode, bgColor: string }) {
    return <>
        <div className={`${bgColor} m-5 rounded-xl`}>
            {children}
        </div>
    </>
}