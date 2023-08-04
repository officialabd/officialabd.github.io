import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    // apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    // authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    // projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    // storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    // messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    // appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,

    apiKey: "AIzaSyDovjYqTPUjV7iC_ic5TLgdzYAWyUfbVp4",
    authDomain: "my-portfolio-ed76f.firebaseapp.com",
    projectId: "my-portfolio-ed76f",
    storageBucket: "my-portfolio-ed76f.appspot.com",
    messagingSenderId: "499321285862",
    appId: "1:499321285862:web:93f5992056d25119841f27",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };

