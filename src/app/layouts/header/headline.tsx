
export default function Headline(
    { text, icon }: { text: string; icon: string; }

) {
    return <div className="mt-2 flex items-center text-sm text-gray-500">
        <svg className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" >
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
        {text}
    </div>
}