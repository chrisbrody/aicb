import axios from 'axios';
import sharp from 'sharp';

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

export default async function handler(req, res) {
    // Handle CORS preflight requests (OPTIONS)
    if (req.method === 'OPTIONS') {
        // Set CORS headers for the preflight request
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return res.status(200).json({});
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { prompt, width, height } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const HUGGING_FACE_TOKEN = process.env.HUGGING_FACE_TOKEN;
        const MODEL_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";

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

        // Set CORS headers for the response
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        res.setHeader('Content-Type', 'image/png');
        res.send(lineArt);

    } catch (error) {
        console.error('Error details:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to generate image',
            details: error.message
        });
    }
}