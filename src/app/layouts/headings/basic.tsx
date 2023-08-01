export default function BasicHeading(
    { text, underline = true, textColor, fontFamily }: {
        text: string,
        underline?: boolean,
        textColor?: string,
        fontFamily?: string,
    }) {
    return <>
        <div className={`flex justify-center font-${fontFamily} ${textColor} text-md font-bold tracking-tight sm:text-xl`}>
            {text}
        </div>
        {underline && <div className="mt-4 border-t border-gray-200" />}
    </>
}