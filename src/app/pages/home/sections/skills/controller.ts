import { db } from "@/../firebase";
import { doc, getDoc } from "firebase/firestore";

const fetchData = async () => {

    const docRef = doc(db, "cities", "SF");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        console.log("Document data:", docSnap.data());
    } else {
        // docSnap.data() will be undefined in this case
        console.log("No such document!");
    }
}

export { fetchData };

