export default function HeadingOne(
    { text, underline = true, textColor }: {
        text: string,
        underline?: boolean,
        textColor?: string
    }) {
    return <>
        <div className="mx-auto max-w-2xl lg:mx-0">
            <h2 className={`font-RobotoMono ${textColor} text-3xl font-bold tracking-tight sm:text-4xl`}>{text}</h2>
        </div>
        {underline && <div className="mt-4 border-t border-gray-200" />}
    </>
}

