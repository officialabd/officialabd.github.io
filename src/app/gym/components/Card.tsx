import type { ReactNode } from "react";

/**
 * Section card for the gym app. Same horizontal layout as the portfolio's shared Card,
 * with tighter vertical spacing (kept separate so gym changes never affect the portfolio).
 */
export default function Card({ heading, children }: { heading?: ReactNode; children: ReactNode }) {
    return (
        <div className="py-3 sm:py-4">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                {heading}
                <div className="mx-auto mt-4 grid w-full max-w-2xl grid-cols-1 gap-x-8 gap-y-6 lg:max-w-none lg:grid-cols-1">
                    {children}
                </div>
            </div>
        </div>
    );
}
