// Required dependencies
const express = require('express');
const axios = require('axios');
const sharp = require('sharp');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables
dotenv.config();

const app = express();

// Configure CORS to use the environment variable for the origin
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000'; // Default to localhost if not set

app.use(cors({
    origin: allowedOrigin, // Your React app's URL
    methods: ['POST', 'GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());

// Configuration
const HUGGING_FACE_TOKEN = process.env.HUGGING_FACE_TOKEN;
const MODEL_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";

// Function to process image into line art
async function createLineArt(imageBuffer) {
    try {
        return await sharp(imageBuffer)
            .ensureAlpha()
            .toColourspace('b-w')
            .png()
            .toBuffer();
    } catch (error) {
        console.error('Error processing image:', error);
        throw error;
    }
}

// Generate image route
app.post('/generate', async (req, res) => {
    try {
        const { prompt, width, height } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        if (!HUGGING_FACE_TOKEN) {
            return res.status(500).json({ error: 'Hugging Face token not configured' });
        }

        const enhancedPrompt = `${prompt}, simple line drawing, black and white, coloring book style, clean lines, minimalistic design, bold outlines, no shading, no gradients, no texture, no colors, flat style, no background shading, crisp and clear contours, blank white background`;

        const response = await axios({
            method: 'post',
            url: MODEL_URL,
            headers: {
                'Authorization': `Bearer ${HUGGING_FACE_TOKEN}`,
                'Content-Type': 'application/json'
            },
            data: {
                inputs: enhancedPrompt,
                parameters: {
                    negative_prompt: "color, shading, realistic, detailed, complexity, texture, gradients",
                    num_inference_steps: 30,
                    guidance_scale: 7.5,
                    height: height || 512,
                    width: width || 512
                }
            },
            responseType: 'arraybuffer'
        });

        // Process the generated image into line art
        const lineArt = await createLineArt(response.data);
        res.set('Content-Type', 'image/png');
        res.send(lineArt);

    } catch (error) {
        console.error('Error details:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to generate image',
            details: error.message
        });
    }
});

// Health check route
app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});