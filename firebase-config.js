// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyACojSVlR7r5-qaBtqpLg7ojaJhKZhSi8M",
  authDomain: "idle-acension.firebaseapp.com",
  projectId: "idle-acension",
  storageBucket: "idle-acension.appspot.com",
  messagingSenderId: "654277125415",
  appId: "1:654277125415:web:4a4a8da595661c8fb13502",
  measurementId: "G-90VJMMM524"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
