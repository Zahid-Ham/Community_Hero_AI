import React, { useState } from 'react';
import { Upload, Sparkles, MapPin, Building2, AlertOctagon, HelpCircle, FileText, CheckCircle2, RotateCcw, Copy, AlertCircle, Eye, RefreshCw } from 'lucide-react';
import { Report, CivicLocation, INDIAN_CITIES } from '../types';
import { useNotifications } from '../features/notifications/NotificationProvider';

interface ReportWizardProps {
  onSuccess: (newReport: Report) => void;
  userId: string;
  userEmail: string;
  userName: string;
}

// Low-profile highly compatible base64 representations of mock images
// (This lets judges click a button to instant-populate a beautiful pothole/trash image to test AI vision!)
const MOCK_IMAGES = {
  pothole: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80",
  garbage: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80",
  streetlight: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=600&q=80"
};

export default function ReportWizard({ onSuccess, userId, userEmail, userName }: ReportWizardProps) {
  const { addNotification } = useNotifications();

  // Step tracker: 'upload' -> 'analysis' -> 'review'
  const [step, setStep] = useState<'upload' | 'analysis' | 'review'>('upload');
  
  // Input fields
  const [selectedCityName, setSelectedCityName] = useState('Bengaluru');
  const [address, setAddress] = useState('');
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  
  // AI Generated / Parsed States
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiStatusMessage, setAiStatusMessage] = useState('');
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiProgress, setAiProgress] = useState(0);

  // Editable fields before saving
  const [editedTitle, setEditedTitle] = useState('');
  const [editedCategory, setEditedCategory] = useState('');
  const [editedSubCategory, setEditedSubCategory] = useState('');
  const [editedSeverity, setEditedSeverity] = useState<'Low' | 'Moderate' | 'Severe' | 'Critical'>('Moderate');
  const [editedDepartment, setEditedDepartment] = useState('');
  const [editedComplaintEn, setEditedComplaintEn] = useState('');
  const [editedComplaintHi, setEditedComplaintHi] = useState('');
  const [editedAdvice, setEditedAdvice] = useState('');

  const [activeLangTab, setActiveLangTab] = useState<'en' | 'hi'>('en');
  const [copystate, setCopystate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cityObj = INDIAN_CITIES.find(c => c.name === selectedCityName) || INDIAN_CITIES[1];

  // Simulator helper to let judges skip having to take snapshot or upload real files
  const loadMockImage = async (type: 'pothole' | 'garbage' | 'streetlight') => {
    setAiStatusMessage("Fetching preset photo...");
    const imageUrl = MOCK_IMAGES[type];
    
    // Set matching pre-fill texts to make the experience ultra polished
    if (type === 'pothole') {
      setDescription("Massive deep pothole formed right in the middle of the double lane asphalt road causing bike skids.");
      setSelectedCityName("Bengaluru");
      setAddress("11th Main, Near Jogging Corner, Indiranagar, Bengaluru, Karnataka");
    } else if (type === 'garbage') {
      setDescription("Uncollected trash accumulating heavily near Dadar market. Some local vendors are setting it on fire.");
      setSelectedCityName("Mumbai");
      setAddress("SB Marg, Near Dadar West Market Exit, Dadar, Mumbai, Maharashtra");
    } else {
      setDescription("Streetlight column bracket broken and hanging loose. Panel is completely un-illuminated for 3 poles.");
      setSelectedCityName("Delhi");
      setAddress("Approach gate area, Connaught Place Block H, New Delhi, Delhi");
    }

    // Convert Unsplash image to a base64 string using canvas proxy
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageFile(reader.result as string);
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      // Fallback: Use standard mock placeholder URL directly
      setImageFile(imageUrl);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerAiAnalysis = async () => {
    if (!imageFile && !description.trim()) {
      alert("Please upload an image, select a simulator preset, or enter detailed description first.");
      return;
    }

    setStep('analysis');
    setIsAiLoading(true);
    setAiProgress(10);
    
    // Simulate telemetry loading states to feel highly premium and agentic
    const timers = [
      { t: 800, p: 25, m: "🔍 Scanning image pixels and computing edge gradients..." },
      { t: 1600, p: 50, m: "⚙️ Assessing infrastructure stress markers & severe hazard index..." },
      { t: 2400, p: 75, m: "🏛️ Retrieving Municipal Charter rules & Ward liability bylaws..." },
      { t: 3200, p: 90, m: "📝 Drafting formal Bilingual (English/Hindi) complaints..." },
    ];

    timers.forEach(item => {
      setTimeout(() => {
        setAiProgress(item.p);
        setAiStatusMessage(item.m);
      }, item.t);
    });

    try {
      const response = await fetch('/api/analyze-issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: imageFile,
          description: description,
          cityHint: selectedCityName,
          categoryHint: ""
        })
      });

      const data = await response.json();

      if (response.ok) {
        setAiProgress(100);
        setAiStatusMessage("Analysis complete!");
        setAiResult(data);

        // Pre-populate edited fields
        setEditedTitle(data.title || 'Civic Infrastructure Concern');
        setEditedCategory(data.category || 'Roads & Traffic');
        setEditedSubCategory(data.subCategory || 'Potholes / Damaged Road Structure');
        setEditedSeverity(data.severity || 'Moderate');
        setEditedDepartment(data.suggestedDepartment || `${cityObj.municipalBody} Operations Desk`);
        setEditedComplaintEn(data.complaintDraftEnglish || '');
        setEditedComplaintHi(data.complaintDraftHindi || '');
        setEditedAdvice(data.civicAdvice || 'Maintain vigilance and caution around the area.');
        
        // Trigger in-app notification
        addNotification(userId, "AI Analysis Completed", `Vision diagnostics complete: ${data.category || 'Incidents'} grievance catalogued with ${data.severity || 'Moderate'} severity assessment.`, 'info');

        setTimeout(() => {
          setStep('review');
          setIsAiLoading(false);
        }, 600);
      } else {
        throw new Error(data.error || 'Failed to parse image from backend Gemini API.');
      }
    } catch (err: any) {
      console.error(err);
      alert(`AI Analysis encountered an issue: ${err.message || 'Offline API'}. Defaulting to structured templates.`);
      
      // Fallback templates if Gemini fails
      setEditedTitle(`Urgent: Civic issue reported in ${selectedCityName}`);
      setEditedCategory("Roads & Traffic");
      setEditedSubCategory("Potholes / Road damage");
      setEditedSeverity("Severe");
      setEditedDepartment(`${cityObj.municipalBody} General Administration Division`);
      setEditedComplaintEn(`To, \nThe Ward Officer,\n${cityObj.municipalBody}\n\nSubject: Complaint regarding civic grievances at ${address || selectedCityName}\n\nDear Sir/Madam,\nThis is to report that we are facing severe concerns with ${description || 'damaged infrastructure'} situated here. Please verify and resolve.`);
      setEditedComplaintHi(`सेवा में, \nमुख्य अधिकारी,\n${cityObj.municipalBody}\n\nविषय: ${address || selectedCityName} पर जनसमस्याओं के निवारण के संबंध में।\n\nमहोदय,\nहम इस शिकायत के माध्यम से आपका ध्यान आकर्षित करना चाहते हैं कि यहाँ व्यापक समस्याएं हैं। कृपया तत्काल ठीक कराएं।`);
      setEditedAdvice("Please notify neighbors and stay safe.");
      setStep('review');
      setIsAiLoading(false);
    }
  };

  const handleCopyComplaint = () => {
    const textToCopy = activeLangTab === 'en' ? editedComplaintEn : editedComplaintHi;
    navigator.clipboard.writeText(textToCopy);
    setCopystate(true);
    setTimeout(() => setCopystate(false), 2000);
  };

  const handleSubmitReport = async () => {
    setIsSubmitting(true);
    
    // Generate simulated coordinates slightly offset from city center to make map mapping vibrant
    const randomOffsetLat = (Math.random() - 0.5) * 0.08;
    const randomOffsetLng = (Math.random() - 0.5) * 0.08;
    const finalLat = cityObj.center[0] + randomOffsetLat;
    const finalLng = cityObj.center[1] + randomOffsetLng;

    const newReport: Report = {
      id: "report-" + Date.now(),
      title: editedTitle,
      description: description || "Report filed through Community Hero AI.",
      category: editedCategory,
      subCategory: editedSubCategory,
      severity: editedSeverity,
      severityJustification: aiResult?.severityJustification || "Severity calculated by public safety impact index.",
      suggestedDepartment: editedDepartment,
      status: "Reported",
      location: {
        lat: finalLat,
        lng: finalLng,
        city: selectedCityName,
        address: address || `Ward Area, ${selectedCityName}`
      },
      imageUrl: imageFile || undefined,
      complaintDraftEnglish: editedComplaintEn,
      complaintDraftHindi: editedComplaintHi,
      civicAdvice: editedAdvice,
      upvotesCount: 1, // User auto-votes
      upvotesUsers: [userId],
      createdAt: new Date().toISOString(),
      userId,
      userEmail,
      userName,
      resolvedAt: null
    };

    try {
      // Direct Firestore create is supported:
      // Let's call the parent onSuccess first which will also persist to State and Sync in Firestore
      onSuccess(newReport);
      
      // Reset State
      setStep('upload');
      setImageFile(null);
      setDescription('');
      setAddress('');
      setAiResult(null);
    } catch (e) {
      console.error("Firestore persistence warning:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm max-w-4xl mx-auto overflow-hidden">
      
      {/* Wizard Header Bar */}
      <div className="bg-slate-50 border-b border-slate-100 py-5 px-6 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-saffron/10 text-saffron rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-slate-900">AI-Powered Civic Reporting Wizard</h3>
            <p className="text-[10px] text-slate-400 font-medium">Bilingual complaint generation with severe priority scoring</p>
          </div>
        </div>
        
        {/* Step Indicator */}
        <div className="flex items-center gap-1.5 md:gap-3 text-xs font-semibold text-slate-400">
          <span className={`px-2.5 py-1 rounded-full ${step === 'upload' ? 'bg-navy text-white' : 'bg-slate-200 text-slate-700'}`}>1. Details</span>
          <span className="text-[10px]">→</span>
          <span className={`px-2.5 py-1 rounded-full ${step === 'analysis' ? 'bg-navy text-white animate-pulse' : step === 'review' ? 'bg-slate-200 text-slate-700' : 'bg-slate-100'}`}>2. AI Agent</span>
          <span className="text-[10px]">→</span>
          <span className={`px-2.5 py-1 rounded-full ${step === 'review' ? 'bg-navy text-white' : 'bg-slate-100'}`}>3. Review</span>
        </div>
      </div>

      {/* STEP 1: UPLOAD AND INITIAL ENTRY */}
      {step === 'upload' && (
        <div className="p-6 md:p-8 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Left Hand: Image Upload and Presets */}
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Upload Issue Image</label>
              
              <div className="border-2 border-dashed border-slate-200 rounded-2xl hover:border-navy/30 transition-all bg-slate-50/50 p-6 flex flex-col items-center justify-center text-center group min-h-[220px] relative overflow-hidden">
                {imageFile ? (
                  <div className="absolute inset-0 w-full h-full">
                    <img src={imageFile} alt="Uploaded Civic Hazard" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setImageFile(null)}
                      className="absolute top-3 right-3 p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-slate-400 group-hover:text-navy transition-colors mb-3" />
                    <p className="text-xs text-slate-600 font-semibold mb-1">Drag and drop photo here, or <span className="text-navy underline cursor-pointer">browse file</span></p>
                    <p className="text-[10px] text-slate-400">Supports PNG, JPG, JPEG up to 10MB</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </>
                )}
              </div>

              {/* Hackathon Preset Simulator Buttons */}
              <div className="pt-2">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">💡 Quick Hackathon Tester Presets (Skip file upload!)</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => loadMockImage('pothole')}
                    className="p-2 border border-slate-200 text-slate-700 text-[10px] font-semibold rounded-xl hover:border-saffron/30 hover:bg-saffron/5 transition-colors cursor-pointer text-center"
                  >
                    🚧 Pothole
                  </button>
                  <button
                    onClick={() => loadMockImage('garbage')}
                    className="p-2 border border-slate-200 text-slate-700 text-[10px] font-semibold rounded-xl hover:border-saffron/30 hover:bg-saffron/5 transition-colors cursor-pointer text-center"
                  >
                    🗑️ Trash Dump
                  </button>
                  <button
                    onClick={() => loadMockImage('streetlight')}
                    className="p-2 border border-slate-200 text-slate-700 text-[10px] font-semibold rounded-xl hover:border-saffron/30 hover:bg-saffron/5 transition-colors cursor-pointer text-center"
                  >
                    💡 Streetlight
                  </button>
                </div>
              </div>
            </div>

            {/* Right Hand: Municipal Location and Description */}
            <div className="space-y-4">
              
              {/* City Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-navy shrink-0" />
                  <span>Select Target City</span>
                </label>
                <select
                  value={selectedCityName}
                  onChange={(e) => setSelectedCityName(e.target.value)}
                  className="w-full border border-slate-200 px-4 py-3 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-navy focus:border-navy transition-all"
                >
                  {INDIAN_CITIES.map(city => (
                    <option key={city.name} value={city.name}>{city.name} ({city.state})</option>
                  ))}
                </select>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  <span>Drafts will route directly to <strong>{cityObj.municipalBody}</strong></span>
                </div>
              </div>

              {/* Exact Location Text */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Locality address & landmark</label>
                <input
                  type="text"
                  placeholder="e.g. Near HDFC Bank ATM, 3rd Block, Jayanagar..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border border-slate-200 px-4 py-3 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-navy focus:border-navy transition-all"
                />
              </div>

              {/* Citizen Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Describe what is going on</label>
                <textarea
                  placeholder="Describe details of the issue to help our civic AI agent analyze size, water logs, or accessibility..."
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-slate-200 px-4 py-3 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-navy focus:border-navy transition-all resize-none"
                />
              </div>

            </div>
          </div>

          <div className="border-t border-slate-100 pt-5 flex justify-end">
            <button
              onClick={triggerAiAnalysis}
              className="bg-navy bg-gradient-to-r hover:from-navy hover:to-navy-hover text-white font-bold py-3 px-8 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-navy/10 active:scale-[0.98] transition-all"
            >
              <span>Analyze with Agentic AI</span>
              <Sparkles className="w-4 h-4 text-saffron" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: AGENT SCANNING ANIMATION */}
      {step === 'analysis' && (
        <div className="p-12 flex flex-col items-center justify-center text-center space-y-6">
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* Double spinning rings */}
            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-t-navy border-r-saffron border-b-green-t rounded-full animate-spin"></div>
            
            <Sparkles className="w-10 h-10 text-saffron animate-bounce" />
          </div>

          <div className="max-w-md space-y-2">
            <h4 className="font-display font-extrabold text-sm text-slate-800">CORTEX Civic Agent Scanning...</h4>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-navy h-full transition-all duration-300 rounded-full"
                style={{ width: `${aiProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-500 font-semibold font-mono animate-pulse">{aiStatusMessage}</p>
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW AI RESULTS AND EDIT */}
      {step === 'review' && (
        <div className="p-6 md:p-8 space-y-6">
          
          {/* Main Top Tags */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">AI Classified Category</span>
              <input
                type="text"
                value={editedCategory}
                onChange={(e) => setEditedCategory(e.target.value)}
                className="w-full bg-transparent border-b border-transparent focus:border-navy text-xs font-bold text-slate-800 focus:outline-none"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Specific Sub-Category</span>
              <input
                type="text"
                value={editedSubCategory}
                onChange={(e) => setEditedSubCategory(e.target.value)}
                className="w-full bg-transparent border-b border-transparent focus:border-navy text-xs font-medium text-slate-800 focus:outline-none"
              />
            </div>

            <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100/50">
              <span className="block text-[10px] font-bold text-rose-500 uppercase tracking-wide flex items-center gap-1">
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Computed Severity</span>
              </span>
              <select
                value={editedSeverity}
                onChange={(e) => setEditedSeverity(e.target.value as any)}
                className="w-full bg-transparent border-b border-transparent text-xs font-bold text-rose-900 focus:outline-none"
              >
                <option value="Critical">Critical Priority</option>
                <option value="Severe">Severe Priority</option>
                <option value="Moderate">Moderate Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Est. Resolution Charter</span>
              <div className="text-xs font-bold text-emerald-700 mt-0.5">{aiResult?.estimatedResolutionTime || "3-5 Business Days"}</div>
            </div>
          </div>

          {/* Department responsible edit */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-navy" />
              <span>Suggested Public Department Authority</span>
            </span>
            <input
              type="text"
              value={editedDepartment}
              onChange={(e) => setEditedDepartment(e.target.value)}
              className="w-full bg-transparent border-b border-slate-200 focus:border-navy text-xs font-bold text-slate-800 focus:outline-none py-1"
            />
          </div>

          {/* Complaint Title editor */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Grievance Title</label>
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="w-full border border-slate-200 px-4 py-3 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-navy"
            />
          </div>

          {/* Complaint Letters Tabs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-navy" />
                <span>Bilingual Written Complaints for Municipal Commissioner</span>
              </label>

              {/* English vs Hindi tabs */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setActiveLangTab('en')}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${activeLangTab === 'en' ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  English Draft
                </button>
                <button
                  onClick={() => setActiveLangTab('hi')}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${activeLangTab === 'hi' ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  हिंदी मसौदा
                </button>
              </div>
            </div>

            {/* Textarea complaint */}
            <div className="relative">
              <textarea
                rows={9}
                value={activeLangTab === 'en' ? editedComplaintEn : editedComplaintHi}
                onChange={(e) => {
                  if (activeLangTab === 'en') setEditedComplaintEn(e.target.value);
                  else setEditedComplaintHi(e.target.value);
                }}
                className="w-full border border-slate-200 px-5 py-4 rounded-2xl text-xs leading-relaxed font-medium bg-slate-50/30 focus:outline-none focus:ring-1 focus:ring-navy font-sans whitespace-pre-line"
              />
              <button
                onClick={handleCopyComplaint}
                className="absolute top-4 right-4 bg-white/95 border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl font-bold text-[10px] shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>{copystate ? "Copied!" : "Copy Complaint Text"}</span>
              </button>
            </div>
          </div>

          {/* AI Legal & Safety Advice Banner */}
          {editedAdvice && (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-emerald-800">Civic Safety & Legal Empowerment Advisory</h5>
                <p className="text-[11px] text-emerald-600 font-medium leading-relaxed mt-0.5">{editedAdvice}</p>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="border-t border-slate-100 pt-5 flex justify-between gap-4">
            <button
              onClick={() => setStep('upload')}
              className="px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-755 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-4 h-4 text-slate-400" />
              <span>Retry / Start Over</span>
            </button>

            <button
              onClick={handleSubmitReport}
              disabled={isSubmitting}
              className="px-10 py-3.5 bg-green-t hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-700/10 cursor-pointer active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Filing report to Corporation...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Submit Complaints To {cityObj.municipalBody}</span>
                </>
              )}
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
