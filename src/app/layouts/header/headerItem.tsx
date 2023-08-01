import Link from "next/link";

export default function HeaderItem({ name, myRef, width, height }: {
    name: string;
    myRef: string;
    width?: string;
    height?: string;
},
) {
    return (
        <Link href={myRef} style={{ scrollBehavior: "smooth" }} scroll>
            <span>
                <button
                    style={{
                        width: width,
                        height: height
                    }}
                    type="button"
                    className="inline-flex items-center rounded-md bg-lime-50 px-3 py-2 text-sm font-semibold text-black shadow-sm hover:bg-lime-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:bg-lime-50">
                    {/* <svg className="-ml-0.5 mr-1.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                    </svg> */}
                    {name}
                </button>
            </span>
        </Link>
    );
}