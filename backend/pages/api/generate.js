import axios from 'axios';
import sharp from 'sharp';

export default async function handler(req, res) {
    const { prompt, width, height } = req.body;

    try {
        const HUGGING_FACE_TOKEN = process.env.HUGGING_FACE_TOKEN;
        const MODEL_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";
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
        const lineArt = await sharp(response.data)
            .ensureAlpha()
            .toColourspace('b-w')
            .png()
            .toBuffer();

        res.setHeader('Content-Type', 'image/png');
        res.send(lineArt);
    } catch (error) {
        console.error('Error generating image:', error);
        res.status(500).json({ error: 'Failed to generate image', details: error.message });
    }
}
