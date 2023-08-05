import { db } from "@/../firebase";
import { collection, getDocs } from "firebase/firestore";

const fetchTechnologiesData = async ({ colName, successCallback, errorCallback }:
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

export {
    fetchTechnologiesData
};

