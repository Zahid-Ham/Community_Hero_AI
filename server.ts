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
        mimeType = parts[0].split(':')[1] || 'image/jpeg';
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

// Multi-Agent Civic Intelligence Platform Orchestrator Endpoint
app.post('/api/agents/execute', async (req, res) => {
  try {
    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on this server.',
      });
    }

    const { agentId, state } = req.body;
    if (!agentId || !state) {
      return res.status(400).json({ error: 'Please provide both agentId and workflow state.' });
    }

    let prompt = '';
    let systemInstruction = '';
    let imagePart: any = null;

    // Helper to extract base64 image data if present
    if (state.imageUrl && state.imageUrl.startsWith('data:')) {
      try {
        const parts = state.imageUrl.split(';base64,');
        const mimeType = parts[0].split(':')[1];
        const base64Data = parts[1];
        imagePart = {
          inlineData: {
            mimeType,
            data: base64Data
          }
        };
      } catch (err) {
        console.warn('Could not parse base64 imageUrl:', err);
      }
    }

    switch (agentId) {
      case 'VisionAgent':
        systemInstruction = 'You are the Vision Agent for a high-performance civic intelligence platform. Your job is to analyze visual evidence of public hazards, detect objects, classify the issue into supported categories, and describe the scene with high precision.';
        prompt = `
          Analyze this civic issue report.
          User Description: "${state.userDescription}"
          City: "${state.city}"
          
          Examine the visual scene details (from the attached image or the description if no image is provided).
          
          You MUST classify the main problem into exactly ONE of the following supported issues. Do not invent any other category. Choose the closest match if not exact:
          - Pothole
          - Garbage Dump
          - Broken Streetlight
          - Waterlogging
          - Illegal Dumping
          - Road Damage
          - Drain Blockage

          Provide a strict JSON response conforming to this schema:
          {
            "detectedIssue": string (MUST be exactly one of the supported issues listed above),
            "confidence": number (confidence rating from 0.0 to 1.0 on how confident you are in the detection/classification),
            "detectedObjects": string[] (list of primary physical items/hazards detected, e.g. ["pothole", "cracked asphalt"]),
            "summary": string (a concise but descriptive summary of the visual scene and infrastructure hazard),
            "imageAnalyzed": boolean (true if an image was provided and successfully analyzed, false otherwise),
            "objectsDetected": string[] (alias of detectedObjects for backwards compatibility),
            "visualSceneDescription": string (alias of summary for backwards compatibility)
          }
        `;
        break;

      case 'ClassificationAgent':
        systemInstruction = 'You are the Civic Classification Agent. Your goal is to accurately categorize and tag urban grievances based on textual and visual evidence.';
        prompt = `
          Based on the reported civic issue, location, and the Vision Agent analysis, classify this issue.
          User Description: "${state.userDescription}"
          City Context: "${state.city}"
          
          Vision Analysis Context:
          - Detected Objects: ${JSON.stringify(state.vision?.objectsDetected || [])}
          - Visual Scene: "${state.vision?.visualSceneDescription || ''}"
          
          Provide standard civic classifications including:
          1. A broad, high-level municipal category (e.g., 'Roads & Traffic', 'Solid Waste Management', 'Water & Sanitation', 'Electricity & Illumination', 'Horticulture & Trees', 'Encroachments & Footpaths', 'Public Health & Safety').
          2. A specific, detailed subCategory (e.g., 'Open Manhole', 'Overflowing Dustbin', 'Clogged Stormwater Drain', 'Defective Streetlight Column', 'Unsanitary Water Accumulation').
          3. A municipal department responsible for the work (e.g., 'Road Maintenance Department', 'Solid Waste Management Division').
          4. A concise complaintType (e.g., 'Pothole', 'Garbage Dump', 'Broken Streetlight', 'Waterlogging', 'Illegal Dumping', 'Road Damage', 'Drain Blockage').
          5. A set of highly descriptive keywords/tags (3-5 tags).
          
          Provide a strict JSON response conforming to this schema:
          {
            "category": string,
            "subCategory": string,
            "municipalDepartment": string,
            "complaintType": string,
            "tags": string[]
          }
        `;
        break;

      case 'SeverityAgent':
        systemInstruction = 'You are the Severity Assessment Agent. Your duty is to prioritize civic grievances by gauging public risk, infrastructure danger, and environmental hazards.';
        prompt = `
          Evaluate the severity of the following reported issue:
          User Description: "${state.userDescription}"
          Category: "${state.classification?.category || ''}"
          Subcategory: "${state.classification?.subCategory || ''}"
          Visual Context: "${state.vision?.visualSceneDescription || ''}"
          
          You MUST decide on an exact severity level from this list: "LOW", "MEDIUM", "HIGH", "CRITICAL".
          - LOW: Nuisance, minimal safety impact (e.g., overgrown weeds).
          - MEDIUM: Localized discomfort, minor safety hazard (e.g., slow drainage, small cracks).
          - HIGH: Active hazard, damage risk, transit block (e.g., overflowing sewer, medium pothole, dark lane).
          - CRITICAL: Extreme immediate threat to human life or infrastructure collapse (e.g., open high-voltage cable, open deep manhole, bridge structure failures).
          
          Formulate a detailed civil engineering safety rationale for this classification and outline specific contributing risk factors.
          Calculate a dynamic numerical priorityScore between 0 and 100 based on the safety and infrastructure risk (0 is lowest priority, 100 is highest/critical).
          Provide an estimatedResponseTime appropriate for the urgency (e.g. "4 hours", "24 hours", "3-5 business days").
          Write a concise publicSafetyImpact summary describing how this issue affects public safety.
          
          Provide a strict JSON response conforming to this schema:
          {
            "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
            "priorityScore": number,
            "riskFactors": string[],
            "estimatedResponseTime": string,
            "publicSafetyImpact": string,
            "severityLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
            "justification": string,
            "impactFactors": string[]
          }
        `;
        break;

      case 'RoutingAgent':
        systemInstruction = 'You are the Municipal Routing Agent. Your objective is to map civic problems to the correct state municipal departments, local boards, and ward divisions.';
        prompt = `
          Identify the appropriate public engineering and ward department division responsible for resolving this issue.
          City Context: "${state.city}"
          Category: "${state.classification?.category || ''}"
          Subcategory: "${state.classification?.subCategory || ''}"
          Severity: "${state.severity?.severityLevel || ''}"
          
          Based on the city, select the exact municipal corporation from the supported Indian metros:
          - Mumbai: Brihanmumbai Municipal Corporation (BMC)
          - Pune: Pune Municipal Corporation (PMC)
          - Bengaluru: Bruhat Bengaluru Mahanagara Palike (BBMP)
          - Hyderabad: Greater Hyderabad Municipal Corporation (GHMC)
          - Chennai: Greater Chennai Corporation (GCC)
          - Ahmedabad: Ahmedabad Municipal Corporation (AMC)
          - Kolkata: Kolkata Municipal Corporation (KMC)
          - Delhi: Municipal Corporation of Delhi (MCD)
          (For other or unrecognized cities, default to the local Municipal Corporation).

          Determine the following structured fields:
          1. "municipalCorporation": The exact municipal body name (e.g., "Brihanmumbai Municipal Corporation (BMC)").
          2. "wardOffice": A specific ward office, zone, or division name (e.g., "Ward A, Fort Division" for Mumbai; "Aundh-Baner Ward Office" for Pune; "Indiranagar Ward, East Zone" for Bengaluru; "Circle 10 (Khairatabad), Zone IV" for Hyderabad; "Zone 5 (Royapuram)" for Chennai; "West Zone Office" for Ahmedabad; "Borough VII" for Kolkata; "Karol Bagh Zone Office" for Delhi).
          3. "responsibleDepartment": The specific wing or division handling the category (e.g., "Roads & Traffic Wing", "Solid Waste Management Division", "Water Supply and Sewerage Board Desk", "Public Lighting Department").
          4. "escalationAuthority": The designated senior officer or escalation desk (e.g., "Assistant Municipal Commissioner (Ward Officer)", "Zonal Deputy Commissioner", "Executive Engineer (Grievances)").
          5. "sla": Expected SLA turnaround resolution timeframe (e.g., "24 Hours" for critical/high, "3 Days" for medium, "7 Days" for low).
          
          Provide a strict JSON response conforming to this schema:
          {
            "department": string (The full responsible department name e.g. "BBMP Road Infrastructure Department"),
            "wardInfo": string (The ward info e.g. "Ward 112 (Indiranagar Division) Chief Engineer"),
            "escalationContact": string (Contact info for escalation e.g. "dycommissioner.swm@municipal.gov.in"),
            "municipalCorporation": string,
            "wardOffice": string,
            "responsibleDepartment": string,
            "escalationAuthority": string,
            "sla": string
          }
        `;
        break;

      case 'DraftingAgent':
        systemInstruction = 'You are the Complaint Drafting Agent. Your role is to write authoritative, formal grievance letters, formal RTI applications, and concise citizen summaries for Indian public services.';
        prompt = `
          Draft a highly professional, polite but firm grievance package for local authorities and citizen empowerment.
          City Context: "${state.city}"
          Address/Locality: "${state.address || 'Grievance Ward Site'}"
          Description: "${state.userDescription}"
          Category: "${state.classification?.category || ''}"
          Subcategory: "${state.classification?.subCategory || ''}"
          Severity: "${state.severity?.severityLevel || ''}"
          Responsible Body: "${state.routing?.department || ''}"
          Municipal Corporation: "${state.routing?.municipalCorporation || ''}"
          Ward/Zone Office: "${state.routing?.wardOffice || ''}"
          Escalation Authority: "${state.routing?.escalationAuthority || ''}"
          SLA: "${state.routing?.sla || ''}"
          
          Generate the following 5 pieces of information:
          1. "subject": A formal official grievance title.
          2. "complaintDraftEnglish": A formal, structured English complaint letter addressed to the Municipal Commissioner/Ward Officer. Cite city-specific or state-level municipal corporation acts (e.g. MMC Act 1888 for BMC Mumbai, PMC Act 1952 for Pune, KMC Act 1976 for Bengaluru, etc. depending on the city) or municipal charter rules, outlining the public safety risks.
          3. "complaintDraftHindi": A formal, precise Hindi translation of the complaint letter in Devanagari script with appropriate bureaucratic Hindi salutations (e.g. "सेवा में, वार्ड अधिकारी...").
          4. "rtiEscalationDraft": A formal, professionally-worded Right to Information (RTI) application draft under Section 6(1) of the RTI Act 2005. It should seek information from the Public Information Officer (PIO) of the municipal corporation regarding:
             a. Details of the budget allocated and spent on the maintenance/repair of the specified area/defect in the current financial year.
             b. The daily progress report/inspection logs on complaints received for this specific location.
             c. The names, designations, and contact details of the sub-engineers and contractors responsible for maintaining this location.
             d. The penalties leviable on contractors or officers for delay in resolution under the citizen charter.
          5. "citizenSummary": A supportive, plain-language summary for the citizen. It must:
             a. Explain why they are legally entitled to have this fixed (referencing municipal responsibilities).
             b. Translate any complex legalities or processes into warm, actionable instructions.
             c. Provide 3 clear, sequential next steps for filing and following up (e.g. 1. Submit on the pg-portal/app, 2. Wait for SLA, 3. File the attached RTI if unresolved).
          
          Provide a strict JSON response conforming to this schema:
          {
            "subject": string (Official grievance title),
            "complaintDraftEnglish": string (Formal English grievance letter),
            "complaintDraftHindi": string (Formal Hindi Devanagari grievance letter),
            "rtiEscalationDraft": string (Formal RTI application text asking targeted questions under RTI Act 2005),
            "citizenSummary": string (A warm, empowering summary of rights, municipal laws/bylaws, and sequential action steps)
          }
        `;
        break;

      case 'RiskPredictionAgent':
        systemInstruction = 'You are the Risk Prediction Agent. You analyze infrastructure damage risk, legal liability, public safety threat vector scores, and generate detailed community risk predictions.';
        prompt = `
          Predict safety and failure risks if this issue is left unaddressed:
          User Description: "${state.userDescription}"
          Severity Level: "${state.severity?.severityLevel || ''}"
          Visual Context: "${state.vision?.visualSceneDescription || ''}"
          Category: "${state.classification?.category || ''}"
          Address/Location: "${state.address || 'Grievance Site'}"
          
          Evaluate:
          1. infrastructureRiskScore: A number from 0 to 100 on how fast this issue will cause physical decay or secondary failure (e.g., expanding pothole, road subsidence).
          2. publicHealthHazards: A list of active disease/health threats (e.g., dengue breeding, water contamination, asthma triggers, injury liability).
          3. legalLiabilityScore: A number from 0 to 100 on municipal negligence liability if a citizen sues or gets injured here.
          4. proactiveMitigationAdvice: Quick preventative actions for citizens or wards (e.g., erecting safety barriers).
          5. futureRisk: A structured prediction explaining the likely long-term trajectory of the defect if ignored (e.g. progressive structural collapse, systemic grid failure).
          6. possibleConsequences: A list of specific possible negative outcomes or events (e.g. for Pothole: ["Vehicle damage", "Accidents", "Ambulance delays"]).
          7. urgencyLevel: A rating of how immediately this must be addressed ("Low", "Medium", "High", "Critical").
          8. recommendations: Actionable municipal or citizen safety/remediation recommendations.
          9. communityImpact: A descriptive statement of how this issue affects local community cohesion, transport, or health.
          
          Provide a strict JSON response conforming to this schema:
          {
            "infrastructureRiskScore": number (0-100),
            "publicHealthHazards": string[],
            "legalLiabilityScore": number (0-100),
            "proactiveMitigationAdvice": string,
            "futureRisk": string,
            "possibleConsequences": string[],
            "urgencyLevel": string,
            "recommendations": string[],
            "communityImpact": string
          }
        `;
        break;

      case 'AdvisoryAgent':
        systemInstruction = 'You are the Civic Advisory Agent. You empower Indian citizens with knowledge of municipal bylaws, statutory service guarantees, safety actions, and legal recourse options.';
        prompt = `
          Provide civic legal and safety advice for this reported issue:
          Issue/Description: "${state.userDescription || ''}"
          Category: "${state.category || ''}"
          Subcategory: "${state.subCategory || ''}"
          Severity Level: "${state.severity || ''}"
          Responsible Department: "${state.department || ''}"
          City: "${state.city || ''}"
          
          Include:
          1. citizenRightsSummary: A brief paragraph of the citizen's legal rights to clean streets, safe roads, or utilities under state municipal corporation acts (e.g. Karnataka Municipal Corporations Act, Mumbai Municipal Corporation Act).
          2. applicableActsAndBylaws: A list of specific relevant laws (e.g., "Solid Waste Management Rules 2016", "Right to Service Act / Sakala Act", "Article 21 (Right to Safe Roads)").
          3. safetyDoAndDonts: Actionable safety points for the immediate neighborhood. Provide "dos" and "donts" lists.
          4. escalationProcedures: A list of step-by-step grievance escalation procedures (e.g., escalating to ward commissioner, deputy commissioner, ombudsman, or lokayukta).
          5. expectedTimelines: Expected resolution SLA timelines under Right to Service or municipal charter (e.g. 24 hours, 48 hours, 7 days).
          6. recommendations: A list of specific recommendations for citizens on how to proceed, track, or safeguard themselves.
          
          Provide a strict JSON response conforming to this schema:
          {
            "citizenRightsSummary": string,
            "applicableActsAndBylaws": string[],
            "safetyDoAndDonts": {
              "dos": string[],
              "donts": string[]
            },
            "escalationProcedures": string[],
            "expectedTimelines": string,
            "recommendations": string[]
          }
        `;
        break;

      case 'HeatmapAgent':
        systemInstruction = 'You are the Heatmap Intelligence Agent. You calculate and model spatial hazard density clusters, ward aggregations, and priority rankings for metropolitan sectors.';
        prompt = `
          Calculate localized spatial priority and density indexes:
          City: "${state.city}"
          Locality/Address: "${state.address || ''}"
          Category: "${state.classification?.category || ''}"
          Severity: "${state.severity?.severityLevel || ''}"
          
          Evaluate:
          1. geohashSector: A localized sector/ward code representing this coordinate region (e.g. "BLR-SEC-7B", "MUM-WRD-F/N").
          2. hazardClusterDensity: "Low", "Medium", or "High" based on typical issue frequencies for this category.
          3. cityHotspotRank: An integer from 1 to 50 on where this locality ranks among city issue clusters (with 1 being the absolute highest hotspot priority).
          4. nearbyRiskMarkers: A list of nearby high-risk sensitive points (e.g., "Within 30m of Public Playground", "Adjacent to Water Supply Main", "Close to High-pedestrian Crossing").
          5. wardRiskIndex: A cumulative risk score from 0 to 100 for this ward/sector based on safety and infrastructure decay factors.
          6. hotspotScore: A priority/density hotspot score from 0 to 100 representing urgency of intervention at this location.
          7. densityCluster: "Low" | "Medium" | "High" reflecting the density of reports in this ward/sector.
          
          Provide a strict JSON response conforming to this schema:
          {
            "geohashSector": string,
            "hazardClusterDensity": "Low" | "Medium" | "High",
            "cityHotspotRank": number,
            "nearbyRiskMarkers": string[],
            "wardRiskIndex": number,
            "hotspotScore": number,
            "densityCluster": "Low" | "Medium" | "High"
          }
        `;
        break;

      default:
        return res.status(400).json({ error: `Invalid agentId: ${agentId}` });
    }

    // Call Gemini-2.5-flash
    let response;
    if (agentId === 'VisionAgent' && imagePart) {
       response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              imagePart
            ]
          }
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json"
        }
      });
    } else {
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json"
        }
      });
    }

    const textResult = response.text || '';
    const parsedData = JSON.parse(textResult.trim());
    return res.json(parsedData);

  } catch (error: any) {
    console.error(`Error executing agent [${req.body?.agentId}]:`, error);
    return res.status(500).json({ 
      error: `Failed to complete ${req.body?.agentId || 'AI'} Agent Execution.`,
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
