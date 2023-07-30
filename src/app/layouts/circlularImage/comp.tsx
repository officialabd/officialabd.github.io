// export default function Avatar(image: string, altText: string) {
export default function Avatar({ image, altText, width = 'w-[20%] sm:w-[13%] md:w-[13%] lg:w-[13%] xl:w-[14%]', height = 'w-[20%] sm:w-[7%] md:w-[8%] lg:w-[9%] xl:w-[10%]' }: {
    image: string;
    altText: string;
    width?: string;
    height?: string;
},
) {
    return (
        <img
            className={`rounded-full ring-2 ring-white ${width} ${height}`}
            src={image}
            alt={altText}
        // style={{
        //     width: width > height ? width : height,
        //     height: width > height ? width : height
        // }}
        />
    )
}