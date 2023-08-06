import CirclePulse from "../pulse/circle";

export default function Icon(
    {
        name,
        url,
        bgColor,
        svgCode,
        loading = false,
    }: {
        name: string,
        url: string,
        bgColor?: string | undefined,
        svgCode: string,
        loading?: boolean
    }) {
    return <>
        {loading ?
            <CirclePulse />
            :
            <a
                href={url}
                target="_blank"
                type="button"
                className={`${bgColor} fill-white w-11 h-11 mb-2 inline-block rounded-full p-3 text-xs font-medium uppercase leading-normal text-white transition duration-150 ease-in-out shadow-sm hover:shadow-slate-400 focus:shadow-lg focus:outline-none focus:ring-0 active:shadow-lg`}
            >
                <img
                    className={`text-white fill-white ${bgColor}`}
                    src={`data:image/svg+xml;utf8,${encodeURIComponent(svgCode)}`}
                    alt={name} />

            </a>
        }
    </>;
}