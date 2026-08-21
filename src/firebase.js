import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged as firebaseOnAuthStateChanged 
} from "firebase/auth";

// Firebase Config milikmu
const firebaseConfig = {
  apiKey: "AIzaSyCo54IHp32XGXx4IXeGdW71LyKnfk9EVm4",
  authDomain: "liquid-8c4d5.firebaseapp.com",
  projectId: "liquid-8c4d5",
  storageBucket: "liquid-8c4d5.firebasestorage.app",
  messagingSenderId: "580828713397",
  appId: "1:580828713397:web:f32d6ec8040bdf91e489fc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Instance Auth & Fungsi Login/Logout untuk App.jsx
export const auth = getAuth(app);

export const loginWithGoogle = () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

export const logoutUser = () => signOut(auth);

export const onAuthStateChanged = (authInstance, callback) => {
  return firebaseOnAuthStateChanged(authInstance, callback);
};
