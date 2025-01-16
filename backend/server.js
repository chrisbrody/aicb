const express = require('express');
const next = require('next');
const cors = require('cors');
const axios = require('axios');
const sharp = require('sharp');
const dotenv = require('dotenv');

dotenv.config();

const app = next({ dev: process.env.NODE_ENV !== 'production' });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = express();

    // Enable CORS
    server.use(cors());

    // API route (same as before)
    server.post('/api/generate', async (req, res) => {
        // Same code as your original Express API route
    });

    // Handle all other routes with Next.js
    server.all('*', (req, res) => {
        return handle(req, res);
    });

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${PORT}`);
    });
});