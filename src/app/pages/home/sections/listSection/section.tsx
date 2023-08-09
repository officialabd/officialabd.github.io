"use client"
import DetailedList from "@/app/layouts/detailedList/detailedList";
import { DetailedListItem } from "@/app/models/Item";
import { useEffect, useState } from 'react';
import { fetchImage, fetchSectionsData } from "../../controller";

export default function Section(
    {
        title,
        collectionName,
    }: {
        title: string
        collectionName: string
    }) {
    const [loading, setLoading] = useState<{
        loading: boolean,
        loadingImages: boolean,
    }>({
        loading: true,
        loadingImages: true,
    });
    const [data, setData] = useState<Object>([]);

    // if (loading) {
    useEffect(() => {

        fetchSectionsData({
            colName: collectionName,
            successCallback: (rs: []) => {
                var tempData: DetailedListItem[] = DetailedListItem.objectsToItemsList(rs);
                var maxToFetch: number = 0;
                var fetchedCorrectly: number = 0;
                tempData.forEach(doc => {
                    const imgsNum = doc.getImages()?.length;
                    var imgsFetched = false;
                    if (doc.getImages()) maxToFetch++;
                    else imgsFetched = true;
                    doc.getImages()?.forEach((imgItem, i) => {
                        fetchImage({
                            imageRef: imgItem.path!,
                            successCallback: (url: string) => {
                                imgItem.url = url;
                                if ((i + 1) == imgsNum)
                                    imgsFetched = true;
                            },
                            errorCallback: (error: any) => console.log(error)
                        });
                    });
                    if (!imgsFetched) console.log(title, collectionName, "Not all images fetched");
                    else fetchedCorrectly++;
                });
                if (maxToFetch == fetchedCorrectly)
                    setLoading((other) => ({ ...other, loadingImages: false }));
                setLoading((other) => ({ ...other, loading: false }));
                setData(tempData);
            },
            errorCallback: (error: any) => console.log(error)
        });
        // }
    }, [])


    return <>
        <DetailedList title={title} loading={loading.loading && loading.loadingImages} items={data as DetailedListItem[]} />
    </>;
}