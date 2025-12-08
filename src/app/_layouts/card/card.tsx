import { ReactNode } from "react";

export default function Card(
    { heading, children, bgColor }: { heading?: ReactNode, children: ReactNode, bgColor?: string }) {
    return <>
        <div className="py-5 mt-25 sm:py-10">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                {heading}
                <div className="mx-auto mt-4 grid w-full max-w-2xl grid-cols-1 gap-x-8 gap-y-4 lg:max-w-none lg:grid-cols-1">
                    {children}
                </div>
            </div>
        </div>
    </>
}