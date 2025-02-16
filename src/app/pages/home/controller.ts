import { db } from "@/../firebase";
import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { getDownloadURL, getStorage, ref } from "firebase/storage";

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

    try {
        const q = query(collection(db, colName), where("show", "in", [true, null]));
        const colSnap = await getDocs(q);

        const docs = colSnap.docs.map(doc => doc.data());
        successCallback(docs);
    } catch (error) {
        errorCallback(error);
    }
}

const fetchImage = async (
    {
        imageRef, successCallback, errorCallback
    }: {
        imageRef: string, successCallback: Function, errorCallback: Function
    }) => {
    //"gs://my-portfolio-ed76f.appspot.com/assets/images/projects/001-NoorBot/0_home.png"
    const imgRef = ref(getStorage(), imageRef);
    await getDownloadURL(imgRef).then((value) => {
        successCallback(value);
    }).catch((error) => {
        errorCallback(error);
    });
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

    const ref = collection(db, collectionName);

    await setDoc(doc(ref, docName), object);
}

// writeCollection({ collectionName: "projects", docName: "001-NoorBot", object: staticData.projects[0].toObject() })



export { fetchImage, fetchMyInfoData, fetchSectionsData, fetchSkillsData, writeCollection };

