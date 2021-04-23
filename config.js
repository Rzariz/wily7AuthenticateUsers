import firebase from 'firebase'
require('@firebase/firestore')

var firebaseConfig = {
    apiKey: "AIzaSyDc7f4W954x8JvbtS_CJD0mRo4xIBRo__U",
    authDomain: "wily-46cfd.firebaseapp.com",
    databaseURL: "https://wily-46cfd.firebaseio.com",
    projectId: "wily-46cfd",
    storageBucket: "wily-46cfd.appspot.com",
    messagingSenderId: "234675649501",
    appId: "1:234675649501:web:496a1a64ca61e3da18d434"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

export default firebase.firestore();
