import Avatar from "@/app/_layouts/avatar/avatar";
import { Technology } from "@/app/models/Technology";
import { useScrollAnimation } from "@/app/hooks/useScrollAnimation";

export default function Technologies({ technologies = [], loading = false }: { technologies?: Technology[], loading?: boolean }) {
    const { ref, isVisible } = useScrollAnimation(0.2);
    
    return <div className="max-w-7xl mx-auto">
        <div 
            ref={ref}
            className={`transition-all duration-700 transform ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
>
            <div className="flex flex-wrap gap-8 justify-center content-center">
            {technologies.map((item, i) => (
                <div
                    key={`Technologies-${i}`}
                    className="group relative flex flex-col items-center transition-all duration-200"
                >
                    {/* Tech Icon Container */}
                    <div className="relative p-4 rounded-lg backdrop-blur-sm bg-slate-800/30 border border-slate-700 transition-all duration-200 group-hover:border-slate-600">
                        <Avatar
                            width="w-16 sm:w-20"
                            height="h-16 sm:h-20"
                            bgColor=""
                            image={`data:image/svg+xml;utf8,${encodeURIComponent(item.getSvgCode()!)}`}
                            altText={`Technologies-${item.getName()}`}
                            text=""
                            padding=""
                            ring=""
                            round=""
                            textColor="text-white"
                            align="text-center"
                            fontSize=""
                        />
                    </div>

                    {/* Tech Name Below Icon */}
                    <span className="mt-3 text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors duration-200">
                        {item.getName()}
                    </span>
                </div>
            ))}
        </div>
        </div>
    </div>
}