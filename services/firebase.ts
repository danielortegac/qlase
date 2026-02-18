import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, getDocs, addDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// GO | Academic Suite Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyB1Tu_SiTjimkrgK6BJx_Ku6EQ0YSBGsrE",
  authDomain: "go-lms-f8551.firebaseapp.com",
  projectId: "go-lms-f8551",
  storageBucket: "go-lms-f8551.firebasestorage.app",
  messagingSenderId: "493003602248",
  appId: "1:493003602248:web:47355027264762f35a9b7d",
  measurementId: "G-80HXJNWJPW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

console.log("GO System: Cloud Uplink Established");

export { app, analytics, db, auth };