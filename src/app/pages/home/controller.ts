import { db } from "@/../firebase";
import staticData from "@/app/staticData";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";

const fetchMyInfoData = async ({ colName, docName, successCallback, errorCallback }:
    { colName: string; docName: string; successCallback: Function; errorCallback: Function }) => {

    const docRef = doc(db, colName, docName);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        successCallback(docSnap.data());
    } else {
        errorCallback(docSnap)
    }
}

const fetchSkillsData = async ({ colName, docName, successCallback, errorCallback }:
    { colName: string; docName: string; successCallback: Function; errorCallback: Function }) => {

    const docRef = doc(db, colName, docName);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        successCallback(Object.values(docSnap.data()[colName]));
    } else {
        errorCallback(docSnap)
    }
}

const fetchSectionsData = async ({ colName, successCallback, errorCallback }:
    { colName: string; successCallback: Function; errorCallback: Function }) => {

    const colSnap = await getDocs(collection(db, colName));

    if (colSnap) {
        var docs = Array<any>();
        colSnap.forEach(doc => {
            docs.push(doc.data());
        });
        successCallback(docs);
    } else {
        errorCallback(colSnap);
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

const writeThem = () => {
    staticData.techs.forEach(tch => {
        writeCollection({
            collectionName: staticData.firebaseConst.collections.technologies,
            docName: `${String(tch.id).padStart(5, '0')}-${tch.name}`, object: tch
        });
    });
}


export {
    fetchMyInfoData, fetchSectionsData, fetchSkillsData, writeCollection
};

