const express = require('express');
const cors = require('cors');
const { Firestore } = require('@google-cloud/firestore');
const { GoogleGenAI, Type } = require('@google/genai');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Load environment variables from .env file for local development
// In Cloud Functions, these should be set as environment variables in the deployment config.
require('dotenv').config();

// --- INITIALIZATION ---
const app = express();
app.use(cors());
app.use(express.json());

// Explicitly providing the Project ID to ensure the correct project is used.
// The databaseId is omitted to use the default Firestore database, which is
// where your data is most likely stored.
const firestore = new Firestore({ 
    projectId: 'gcp-demo-02-307713'
});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
        console.error('SIGNUP_ERROR_DETAILS:', error);
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

        // Defensively check if the password field exists before attempting to compare.
        // This prevents a server crash if an old user record is missing this field.
        if (!userData.password || typeof userData.password !== 'string') {
            console.error(`Authentication failed for ${email}: User record is missing a valid password hash.`);
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const isPasswordValid = await bcrypt.compare(password, userData.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const token = jwt.sign({ userId: userDoc.id, email: userData.email }, JWT_SECRET, { expiresIn: '1d' });
        res.status(200).json({ email: userData.email, token });
    } catch (error) {
        console.error('SIGNIN_ERROR_DETAILS:', error);
        res.status(500).json({ error: 'An internal error occurred.' });
    }
});

// --- LINK ROUTES ---
app.get('/links', authMiddleware, async (req, res) => {
    try {
        const linksRef = firestore.collection('links');
        const snapshot = await linksRef.where('userId', '==', req.user.id).get();
        
        const links = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(links);
    } catch (error) {
        console.error('GET_LINKS_ERROR_DETAILS:', error);
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
        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["title", "summary", "tags"],
        };
        const prompt = `Analyze the content of the URL: ${url}. Provide a concise one-paragraph summary, a suitable title, and 3-5 relevant lowercase tags. Respond with a single JSON object with keys: 'title', 'summary', and 'tags'.`;

        const geminiResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        const processedData = JSON.parse(geminiResponse.text);

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
        console.error('ADD_LINK_ERROR_DETAILS:', error);
        res.status(500).json({ error: 'Failed to analyze or save the link.' });
    }
});

// Expose the Express app as a single Cloud Function for 2nd Gen
exports.api = app;