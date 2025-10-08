
const express = require('express');
const cors = require('cors');
const { Firestore } = require('@google-cloud/firestore');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

require('dotenv').config();

// --- INITIALIZATION ---
const app = express();
app.use(cors());
app.use(express.json());

// This should be automatically configured in Cloud Functions environment
const firestore = new Firestore({
    databaseId: 'vibecodingchallenge2'
});
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const JWT_SECRET = process.env.JWT_SECRET;

if (!process.env.API_KEY || !JWT_SECRET) {
    console.error("FATAL ERROR: API_KEY and JWT_SECRET environment variables are required.");
}

// --- MIDDLEWARE ---
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = { id: decoded.userId };
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token.' });
    }
};

// --- ROOT ROUTE ---
app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Link Summarizer API is running.' });
});

// --- AUTH ROUTES ---
app.post('/signup', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password || password.length < 6) {
        return res.status(400).json({ error: 'Invalid input. Email and password (min 6 chars) are required.' });
    }

    try {
        const usersRef = firestore.collection('users');
        const snapshot = await usersRef.where('email', '==', email).get();
        if (!snapshot.empty) {
            return res.status(409).json({ error: 'An account with this email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUserRef = await usersRef.add({ email, password: hashedPassword });

        const token = jwt.sign({ userId: newUserRef.id, email }, JWT_SECRET, { expiresIn: '1d' });
        res.status(201).json({ email, token });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ error: 'An internal error occurred.' });
    }
});

app.post('/signin', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }
    try {
        const usersRef = firestore.collection('users');
        const snapshot = await usersRef.where('email', '==', email).limit(1).get();
        if (snapshot.empty) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();
        
        const isPasswordValid = await bcrypt.compare(password, userData.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const token = jwt.sign({ userId: userDoc.id, email: userData.email }, JWT_SECRET, { expiresIn: '1d' });
        res.status(200).json({ email: userData.email, token });
    } catch (error) {
        console.error('Error during signin:', error);
        res.status(500).json({ error: 'An internal error occurred.' });
    }
});

// --- LINK ROUTES ---
app.get('/links', authMiddleware, async (req, res) => {
    try {
        const linksRef = firestore.collection('links');
        const snapshot = await linksRef.where('userId', '==', req.user.id).orderBy('createdAt', 'desc').get();
        
        const links = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(links);
    } catch (error) {
        console.error('Error fetching links:', error);
        res.status(500).json({ error: 'Failed to retrieve links.' });
    }
});

app.post('/links', authMiddleware, async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'URL is required.' });
    }

    try {
        // 1. Process URL with Gemini API
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `Analyze the content of the following URL: ${url}. Based on its content, provide a concise one-paragraph summary, a suitable title for a bookmark, and a list of 3-5 relevant lowercase tags. Your entire response must be a single JSON object with the keys: 'title', 'summary', and 'tags' (an array of strings). Do not include any text or formatting outside of this JSON object.`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const cleanedJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const processedData = JSON.parse(cleanedJson);

        // 2. Create and save the new link item
        const newLink = {
            userId: req.user.id,
            url,
            title: processedData.title,
            summary: processedData.summary,
            tags: processedData.tags,
            createdAt: new Date().toISOString(),
        };

        const docRef = await firestore.collection('links').add(newLink);
        res.status(201).json({ id: docRef.id, ...newLink });
    } catch (error) {
        console.error('Error adding link:', error);
        res.status(500).json({ error: 'Failed to analyze or save the link.' });
    }
});

// Expose the Express app as a single Cloud Function
exports.api = app;
