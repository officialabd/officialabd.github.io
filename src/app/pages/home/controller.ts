import { db } from "@/../firebase";
import { collection, doc, getDoc, setDoc } from "firebase/firestore";

const fetchData = async ({ colName, docName, successCallback, errorCallback }:
    { colName: string; docName: string; successCallback: Function; errorCallback: Function }) => {

    const docRef = doc(db, colName, docName);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        successCallback(Object.values(docSnap.data()[colName]));
    } else {
        errorCallback(docSnap)
    }
}

const writeCollection = async (
    {
        collectionName,
        docName,
        object,
    }: {
        collectionName: string;
        docName: string;
        object: {};
    }) => {

    const citiesRef = collection(db, collectionName);

    await setDoc(doc(citiesRef, docName), object);
}

export { fetchData };

