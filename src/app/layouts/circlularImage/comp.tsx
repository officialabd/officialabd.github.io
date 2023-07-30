// export default function Avatar(image: string, altText: string) {
export default function Avatar({ image, altText, width = '10%', height = '10%' }: {
    image: string;
    altText: string;
    width?: string;
    height?: string;
},
) {
    return (
        <img
            className="rounded-full ring-2 ring-white"
            src={image}
            alt={altText}
            style={{
                width: width,
                height: height
            }}
        />
    )
}