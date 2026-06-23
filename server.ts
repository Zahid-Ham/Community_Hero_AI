import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Increase request sizes for base64 images
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ limit: '12mb', extended: true }));

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// API Route 1: Analyze civic issue image/details
app.post('/api/analyze-issue', async (req, res) => {
  try {
    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on this server. Please setup your Gemini API Key in the AI Studio secrets.',
      });
    }

    const { image, description, categoryHint, cityHint } = req.body;

    if (!image && !description) {
      return res.status(400).json({ error: 'Please provide either an image or a description of the issue.' });
    }

    const prompt = `
      You are an expert civic AI agent helping Indian citizens analyze, categorize, and draft complaints for local municipal civic issues.
      Your goal is to parse the input (which includes a user's description and/or an uploaded image of an issue) and output structured civic analytics.
      
      User's description: ${description || 'No text description provided. Please analyze the image content to determine the problem details.'}
      City Context: ${cityHint || 'General municipal region, India'}
      Category Hint: ${categoryHint || 'Auto-detect'}

      Provide a strict, valid JSON response with the following keys. Do not include markdown wraps or anything except the JSON object.
      
      JSON keys:
      {
        "category": "Broad category of the issue (e.g., 'Roads & Traffic', 'Solid Waste Management', 'Water & Sanitation', 'Electricity & Illumination', 'Horticulture & Trees', 'Encroachments & Footpaths')",
        "subCategory": "Specific type of issue (e.g., 'Complex Potholes / Damaged Road Structure', 'Garbage Dump Overflowing', 'Sewer Water Leakage / Closed Drains', 'Defective Streetlight Column', 'Uprooted Tree Limbs blockading footpaths')",
        "severity": "Low, Moderate, Severe, or Critical. Dynamic gauge based on public endangerment, biohazard risk, or structural liability.",
        "severityJustification": "A detailed 1-2 sentence civil safety rationale of why this severity level was assigned.",
        "suggestedDepartment": "The designated Municipal body and ward department (e.g., 'Bruhat Bengaluru Mahanagara Palike (BBMP) Street Infrastructure division', 'Municipal Corporation of Delhi (MCD) Sanitation Division', 'Brihanmumbai Municipal Corporation (BMC) Ward Road Engineer', etc.)",
        "title": "A highly punchy, official-looking grievance title summarizing the report (e.g., 'Immediate Hazard: Severe Sewer Water Backflow / Drain Leakage')",
        "complaintDraftEnglish": "A formal, polite, and firm municipal grievance letter in English. Use formal greeting like 'To, The Ward Officer / Assistant Commissioner...', describe the issue, highlight public health risks or safety liabilities, mention state municipal compliance duty, demand resolution timelines, and draft with high professionalism.",
        "complaintDraftHindi": "The exact formal complaint letter translated in pristine official Hindi (Devanagari script) with appropriate cultural salutations (e.g., 'सेवा में, सहायक नगर आयुक्त...').",
        "civicAdvice": "Practical safety advice or regulatory empowerment for citizens (e.g., quoting Indian Municipal Acts or Swachh Bharat guidelines, or urgent safety instructions like 'Avoid touching open wet wiring', 'Redirect oncoming two-wheelers around hole')",
        "estimatedResolutionTime": "A factual estimation based on Indian city performance charters (e.g., '24 Hours', '48 Hours', '3-5 Business Days')"
      }
    `;

    let response;
    
    if (image) {
      let cleanedBase64 = image;
      let mimeType = 'image/jpeg';
      if (image.startsWith('data:')) {
        const parts = image.split(';base64,');
        cleanedBase64 = parts[1];
        mimeType = parts[0].split(':')[0].split(':')[1];
      }

      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: cleanedBase64
                }
              }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });
    } else {
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
    }

    const textResult = response.text || '';
    const parsedData = JSON.parse(textResult.trim());
    return res.json(parsedData);

  } catch (error: any) {
    console.error('Error analyzing civic issue:', error);
    return res.status(500).json({ 
      error: 'Failed to complete AI Municipal Analysis.',
      details: error.message 
    });
  }
});

// API Route 2: Civic Assistant Bot
app.post('/api/civic-chat', async (req, res) => {
  try {
    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on this server.',
      });
    }

    const { message, chatHistory } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Please provide a message.' });
    }

    const systemInstruction = `
      You are "Nagrik Shastra", the Civic AI Assistant for the "Community Hero" platform.
      Your goal is to guide Indian citizens through municipal grievances, local bylaws, the Right to Information (RTI) Act 2005, and Swachh Bharat protocols.
      
      Respond directly and helpfully with:
      - Clean, actionable bullet points.
      - Relevant Indian rules (e.g., Solid Waste Management Rules 2016, Municipal bylaws in cities like Bengaluru, Mumbai, Delhi, Chennai, Pune).
      - Step-by-step guides (e.g., how to request a local pothole fix, how to file an RTI, who is the ward committee member).
      - Warm, encouraging, and empowering civic tone. Avoid saying 'As an AI...' - speak as an expert public service advisor.
    `;

    const conversation = [
      { text: systemInstruction },
      ...(chatHistory || []).map((h: any) => `${h.role === 'user' ? 'Citizen' : 'Nagrik Shastra'}: ${h.text}`),
      `Citizen: ${message}`
    ].join('\n\n');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: conversation,
    });

    return res.json({ text: response.text });

  } catch (error: any) {
    console.error('Error in civic chatbot:', error);
    return res.status(500).json({ 
      error: 'Civic Assistant service is currently offline. Please try again.',
      details: error.message 
    });
  }
});

// Serve frontend assets
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Community Hero] Full-Stack server booted. listening on port ${PORT}`);
  });
}

setupServer();
