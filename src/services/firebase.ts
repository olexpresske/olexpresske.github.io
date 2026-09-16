import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
const firebaseConfig = {
  apiKey: "AIzaSyDc6N5dULG6i72EWrlTtunwhbKQxaVi2KY",
  authDomain: "olexpresske.firebaseapp.com",
  databaseURL: "https://olexpresske-default-rtdb.firebaseio.com",
  projectId: "olexpresske",
  storageBucket: "olexpresske.firebasestorage.app",
  messagingSenderId: "953335654623",
  appId: "1:953335654623:web:1b91cbd29c1f63a23ba16a"
};
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
