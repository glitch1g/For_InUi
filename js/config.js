/* ============================================
   CONFIG
   ============================================ */

  const firebaseConfig = {
    apiKey: "AIzaSyCyE_KyxgSn_oreFzkpvg9Gnfbv6FCZ2rM",
    authDomain: "project-8718719987786325599.firebaseapp.com",
    databaseURL: "https://project-8718719987786325599-default-rtdb.firebaseio.com",
    projectId: "project-8718719987786325599",
    storageBucket: "project-8718719987786325599.firebasestorage.app",
    messagingSenderId: "584913364315",
    appId: "1:584913364315:web:d9986ef8f6df183ea6267e"
  };

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  
  // ============================================
  // 🛡️ FIREBASE APP CHECK (SECURITY)
  // ============================================
  const appCheck = firebase.appCheck();
  appCheck.activate(
    '6LcEtGUsAAAAAHyQLdvtKrYCO4zaKwsre_s7awzF', // reCAPTCHA site key
    true // Pass true to enable automatic refresh
  );
  
  const database = firebase.database();
  
  console.log('🔥 Firebase connected successfully!');
  console.log('🛡️ App Check enabled!');

  // ============================================
  // 2️⃣ MEMORY BOX FUNCTIONS
  // ============================================
  
  // Simpan memory baru
