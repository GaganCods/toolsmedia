// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCw_aMgqTQVMVP97CrbPzhOY-Iv1woQoOk",
    authDomain: "quick-solve-new.firebaseapp.com",
    databaseURL: "https://quick-solve-new-default-rtdb.firebaseio.com",
    projectId: "quick-solve-new",
    storageBucket: "quick-solve-new.appspot.com",
    messagingSenderId: "120018244388",
    appId: "1:120018244388:web:8015fd5f3c9e5f9af8d9b1",
    measurementId: "G-KKWCSWKD9G"
};

// Initialize Firebase and export services
(function initializeFirebase() {
    try {
        // Initialize Firebase app if not already initialized
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        // Initialize and export services
        window.auth = firebase.auth();
        window.db = firebase.firestore();
        window.rtdb = firebase.database();
        window.storage = firebase.storage();
        window.analytics = firebase.analytics();
        window.functions = firebase.functions();
        window.googleProvider = new firebase.auth.GoogleAuthProvider();

        // Configure Firestore settings
        window.db.settings({ ignoreUndefinedProperties: true });

        console.log('Firebase services initialized successfully');
    } catch (error) {
        console.error('Critical error initializing Firebase:', error);
        if (window.showToast) {
            window.showToast('error', 'Failed to initialize Firebase services');
        }
    }
})();



