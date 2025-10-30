// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDWyoZ0D7Fpun_lF4OORbjycsAogW-JYE8",
  authDomain: "sahaaya-2c243.firebaseapp.com",
  projectId: "sahaaya-2c243",
  storageBucket: "sahaaya-2c243.firebasestorage.app",
  messagingSenderId: "352972197191",
  appId: "1:352972197191:web:750fe57e5fc9d87930d062",
  measurementId: "G-14B0SD9E6Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);