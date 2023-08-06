import { db } from "@/../firebase";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
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

