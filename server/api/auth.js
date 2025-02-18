const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: process.env.FIREBASE_DATABASE_URL
});

// Handle authentication requests
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Authenticate user through Firebase Admin SDK
        const userRecord = await admin.auth().getUserByEmail(email);
        // Generate custom token
        const token = await admin.auth().createCustomToken(userRecord.uid);
        res.json({ token });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

module.exports = router; 