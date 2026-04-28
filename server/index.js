const express = require("express");
const multer = require("multer");
const cors = require("cors");
const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");

const app = express();
const upload = multer({ dest: "uploads/", limits: { fileSize: 10 * 1024 * 1024 } });

app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/transcreate", upload.single("image"), async (req, res) => {
  try {
    const { sourceCountry, targetCountry } = req.body;
    const imageFile = req.file;

    if (!imageFile || !sourceCountry || !targetCountry) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Read image and convert to base64
    const imageBuffer = fs.readFileSync(imageFile.path);
    const base64Image = imageBuffer.toString("base64");
    const mimeType = imageFile.mimetype || "image/jpeg";

    // Step 1: GPT-4V analyzes the image and generates a transcreation prompt
    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64Image}` },
            },
            {
              type: "text",
              text: `You are a cultural transcreation expert. Analyze this image from ${sourceCountry} culture.

Your task:
1. Identify ALL cultural elements: clothing, symbols, colors, food, architecture, gestures, decorations, festivals, art styles, typography, etc.
2. Generate a detailed DALL-E image generation prompt that recreates this image but adapted for ${targetCountry} culture. Replace every cultural element with its ${targetCountry} equivalent while preserving the same composition, mood, lighting, and overall narrative/purpose of the image.

Respond in this EXACT JSON format:
{
  "analysis": "Brief description of the original image and its cultural elements",
  "culturalElements": ["element1 from ${sourceCountry}", "element2", ...],
  "transcreatedElements": ["${targetCountry} equivalent1", "equivalent2", ...],
  "dallePrompt": "Highly detailed DALL-E 3 prompt for the transcreated image..."
}`,
            },
          ],
        },
      ],
    });

    const rawContent = analysisResponse.choices[0].message.content;
    
    // Parse JSON from response
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse GPT-4V response");
    
    const analysisData = JSON.parse(jsonMatch[0]);

    // Step 2: Generate transcreated image with DALL-E 3
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: analysisData.dallePrompt + ` High quality, photorealistic, culturally authentic ${targetCountry} aesthetic.`,
      n: 1,
      size: "1024x1024",
      quality: "hd",
    });

    const generatedImageUrl = imageResponse.data[0].url;

    // Cleanup uploaded file
    fs.unlinkSync(imageFile.path);

    res.json({
      success: true,
      analysis: analysisData.analysis,
      culturalElements: analysisData.culturalElements,
      transcreatedElements: analysisData.transcreatedElements,
      generatedImageUrl,
      revisedPrompt: imageResponse.data[0].revised_prompt,
    });

  } catch (error) {
    console.error("Transcreation error:", error);
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch {}
    }
    res.status(500).json({ error: error.message || "Transcreation failed" });
  }
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
