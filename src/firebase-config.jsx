// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCeC6pdqiToxJBkiA24J5zX5EfV2X7sUq8",
  authDomain: "pa-sera-2025.firebaseapp.com",
  projectId: "pa-sera-2025",
  storageBucket: "pa-sera-2025.firebasestorage.app",
  messagingSenderId: "32848499662",
  appId: "1:32848499662:web:4d2b39589b2ba020c3919f",
  measurementId: "G-69MFSSYVL8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export const db = getFirestore(app);
