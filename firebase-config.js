window.firebaseSettings = {
  authRuntime: {
    linkedinBackendUrl:
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000"
        : "https://chamber-page-2.onrender.com"
  },
  facebookAppId: "995894360086658",
  firebaseConfig: {
    apiKey: "AIzaSyBsp98NSUve1J9CNv9ujgOTF7-FOGY23LU",
    authDomain: "chamber-page-cead3.firebaseapp.com",
    projectId: "chamber-page-cead3",
    storageBucket: "chamber-page-cead3.firebasestorage.app",
    messagingSenderId: "1070418611467",
    appId: "1:1070418611467:web:062b5bd13e6d5f0eb8260e",
    measurementId: "G-P83GDECS4N"
  }
};
