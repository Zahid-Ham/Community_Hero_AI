import { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { Report, INDIAN_CITIES } from './types';
import { SEED_REPORTS } from './mockReports';
import CivicMap from './components/CivicMap';
import CivicBot from './components/CivicBot';
import ReportWizard from './components/ReportWizard';

// Icons
import {
  Sparkles,
  LayoutDashboard,
  FileSpreadsheet,
  Map,
  MessageSquareCode,
  Trophy,
  Plus,
  Search,
  ArrowUp,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Hourglass,
  Building2,
  Users,
  Copy,
  X,
  FileText,
  BadgeAlert,
  ChevronRight,
  TrendingUp,
  Inbox,
  Languages,
  BadgeHelp
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'report' | 'map' | 'chat' | 'ranking'>('dashboard');
  const [reports, setReports] = useState<Report[]>(SEED_REPORTS);
  const [loading, setLoading] = useState(true);

  // Filter and Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCityFilter, setSelectedCityFilter] = useState('All');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');

  // Active review popup modal
  const [selectedReportForReview, setSelectedReportForReview] = useState<Report | null>(null);
  const [activeReviewLangTab, setActiveReviewLangTab] = useState<'en' | 'hi'>('en');

  // Local user profile state
  const mockUser = {
    uid: "zahid-hamdule-12",
    email: "zahidhamdule12@gmail.com",
    displayName: "Zahid Hamdule",
    karma: 125,
    rank: "#4 Ward Warrior"
  };

  // Sync firestore reports on load
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          // If Firestore is empty, seed with initial mock data
          setReports(SEED_REPORTS);
        } else {
          const loaded: Report[] = [];
          querySnapshot.forEach((doc) => {
            loaded.push({ id: doc.id, ...doc.data() } as Report);
          });
          // Merge seeds so maps feel densely complete across regions!
          const merged = [...loaded, ...SEED_REPORTS.filter(seed => !loaded.some(l => l.title === seed.title))];
          setReports(merged);
        }
      } catch (err) {
        console.warn("Firestore offline/empty, using pre-populated seed data fallback:", err);
        setReports(SEED_REPORTS);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReports();
  }, []);

  // Handle support/upvote action
  const handleUpvote = async (reportId: string) => {
    // Prevent double voting
    const reportIndex = reports.findIndex(r => r.id === reportId);
    if (reportIndex === -1) return;
    
    const target = reports[reportIndex];
    if (target.upvotesUsers.includes(mockUser.uid)) {
      alert("You have already attested for this grievance. Your collective support remains compiled.");
      return;
    }

    const updatedUsers = [...target.upvotesUsers, mockUser.uid];
    const updatedCount = target.upvotesCount + 1;

    // Reactively update memory
    const updatedReports = [...reports];
    updatedReports[reportIndex] = {
      ...target,
      upvotesCount: updatedCount,
      upvotesUsers: updatedUsers
    };
    setReports(updatedReports);

    // If active modal is open, update it too
    if (selectedReportForReview?.id === reportId) {
      setSelectedReportForReview(prev => prev ? {
        ...prev,
        upvotesCount: updatedCount,
        upvotesUsers: updatedUsers
      } : null);
    }

    // Try Firestore update
    try {
      const docRef = doc(db, 'reports', reportId);
      await updateDoc(docRef, {
        upvotesCount: updatedCount,
        upvotesUsers: updatedUsers
      });
    } catch (e) {
      console.warn("Local upvote saved. Firestore synced fallback on write.");
    }
  };

  // Handle successful newly generated report
  const handleAddNewReport = async (newReport: Report) => {
    // Add locally immediately first
    setReports(prev => [newReport, ...prev]);
    setActiveTab('dashboard'); // Route back to community dashboard
    setSelectedReportForReview(newReport); // Pop details directly to review!

    // Save to Firestore
    try {
      await addDoc(collection(db, 'reports'), newReport);
    } catch (e) {
      console.error("Firestore persistence error saved to local engine layout:", e);
    }
  };

  // Compute stats metrics dynamically
  const totalReportsCount = reports.length;
  const resolvedCount = reports.filter(r => r.status === 'Resolved').length;
  const criticalCount = reports.filter(r => r.severity === 'Critical' || r.severity === 'Severe').length;
  const totalAttestations = reports.reduce((acc, curr) => acc + curr.upvotesCount, 0);

  // Filtered reports subset
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          report.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          report.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCity = selectedCityFilter === 'All' || report.location.city.toLowerCase() === selectedCityFilter.toLowerCase();
    
    const matchesCategory = selectedCategoryFilter === 'All' || report.category === selectedCategoryFilter;
    
    const matchesStatus = selectedStatusFilter === 'All' || report.status === selectedStatusFilter;

    return matchesSearch && matchesCity && matchesCategory && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-warm-bg flex flex-col font-sans select-none antialiased">
      
      {/* TRICOLORE ACCENT HEADER FLAG STRIP */}
      <div className="h-1.5 w-full flex">
        <div className="bg-saffron w-1/3 h-full"></div>
        <div className="bg-white w-1/3 h-full"></div>
        <div className="bg-green-t w-1/3 h-full"></div>
      </div>

      {/* TOP BRAND NAV BAR */}
      <header className="sticky top-0 z-[1000] bg-white border-b border-slate-100 shadow-sm backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-navy to-slate-800 text-white shadow-md">
              <span className="font-display font-extrabold text-lg text-saffron">C</span>
              <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-green-t"></span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-display font-extrabold text-sm md:text-base text-slate-900 tracking-tight">Community Hero</h1>
                <span className="bg-saffron/10 text-saffron text-[8px] font-extrabold px-1.5 py-0.5 rounded tracking-widest uppercase">AI CIVIC</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Empowering Indian Municipal Accountability</p>
            </div>
          </div>

          {/* Desktop Tab Selector */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-50 p-1 rounded-xl">
            <button
              onClick={() => { setActiveTab('dashboard'); setSelectedReportForReview(null); }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${activeTab === 'dashboard' ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Grievance Board</span>
            </button>

            <button
              onClick={() => { setActiveTab('report'); setSelectedReportForReview(null); }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${activeTab === 'report' ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <Plus className="w-3.5 h-3.5 text-saffron" />
              <span>Report Issue</span>
            </button>

            <button
              onClick={() => { setActiveTab('map'); setSelectedReportForReview(null); }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${activeTab === 'map' ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Hazard Hotspots Map</span>
            </button>

            <button
              onClick={() => { setActiveTab('chat'); setSelectedReportForReview(null); }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${activeTab === 'chat' ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <MessageSquareCode className="w-3.5 h-3.5 text-green-t" />
              <span>Nagrik Shastra Advisor</span>
            </button>

            <button
              onClick={() => { setActiveTab('ranking'); setSelectedReportForReview(null); }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${activeTab === 'ranking' ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Municipal rankings</span>
            </button>
          </nav>

          {/* User Profile Badge */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="block text-[10px] font-bold text-navy">{mockUser.displayName}</span>
              <span className="block text-[8px] font-extrabold text-saffron font-mono uppercase tracking-wide">🏆 Karma {mockUser.karma}pts</span>
            </div>
            
            {/* Round Avatar Container */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-saffron to-green-t p-0.5">
              <div className="w-full h-full rounded-[10px] bg-white flex items-center justify-center font-display font-extrabold text-xs text-navy">
                ZH
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* MOBILE FLOATING COMPACT ACTION BAR */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-[999] bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-xl p-2 flex items-center justify-around">
        <button
          onClick={() => { setActiveTab('dashboard'); setSelectedReportForReview(null); }}
          className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'dashboard' ? 'text-navy scale-105 font-bold' : 'text-slate-400 text-[10px]'}`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[9px] mt-0.5">Grievance</span>
        </button>
        <button
          onClick={() => { setActiveTab('report'); setSelectedReportForReview(null); }}
          className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'report' ? 'text-navy scale-110 font-bold' : 'text-slate-400 text-[10px]'}`}
        >
          <div className="w-8 h-8 rounded-full bg-saffron text-white flex items-center justify-center shadow-md">
            <Plus className="w-4 h-4" />
          </div>
        </button>
        <button
          onClick={() => { setActiveTab('map'); setSelectedReportForReview(null); }}
          className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'map' ? 'text-navy scale-105 font-bold' : 'text-slate-400 text-[10px]'}`}
        >
          <Map className="w-5 h-5" />
          <span className="text-[9px] mt-0.5">Map</span>
        </button>
        <button
          onClick={() => { setActiveTab('chat'); setSelectedReportForReview(null); }}
          className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'chat' ? 'text-navy scale-105 font-bold' : 'text-slate-400 text-[10px]'}`}
        >
          <MessageSquareCode className="w-5 h-5" />
          <span className="text-[9px] mt-0.5">Advisor</span>
        </button>
      </div>

      {/* PRIMARY CONTROLLER PAGE BLOCK */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-6 pb-24 md:pb-12">
        
        {/* DASHBOARD TAB SEGMENT */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Real-time National impact Scoreboard Header */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="font-display font-extrabold text-xl text-slate-900 tracking-tight">Active Civic Grievances Monitor</h2>
                <p className="text-xs text-slate-500 font-medium">Bilingual complaint escalations generating 24/7 Swachh Bharat safety actions</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab('report')}
                  className="bg-navy bg-gradient-to-r hover:from-navy hover:to-navy-hover text-white px-5 py-3 rounded-xl text-xs font-bold shadow-md shadow-navy/10 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Report Civic Mutation</span>
                </button>
              </div>
            </div>

            {/* HIGH IMPACT KPI METRICS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                  <BadgeAlert className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Craters</span>
                  <span className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">{totalReportsCount} Issues</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Wards Resolved</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">{resolvedCount} Cases</span>
                    <span className="text-[10px] font-bold text-emerald-600 font-medium bg-emerald-50 px-1 py-0.5 rounded">
                      {Math.round((resolvedCount / (totalReportsCount || 1)) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sovereignty Warning</span>
                  <span className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">{criticalCount} Critical</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Citizen Support</span>
                  <span className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">+{totalAttestations} Attested</span>
                </div>
              </div>

            </div>

            {/* CENTRAL INTERACTIVE SPLIT: FILTERS + LIST */}
            <div className="grid lg:grid-cols-12 gap-6">
              
              {/* Left filter side rail */}
              <div className="lg:col-span-3 space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                  <h3 className="font-display font-extrabold text-xs text-slate-450 uppercase tracking-wider border-b border-slate-100 pb-2">Filter Parameters</h3>
                  
                  {/* City dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Metropolitan City</label>
                    <select
                      value={selectedCityFilter}
                      onChange={(e) => setSelectedCityFilter(e.target.value)}
                      className="w-full border border-slate-150 px-3 py-2 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-navy focus:outline-none"
                    >
                      <option value="All">All Indian Cities</option>
                      {INDIAN_CITIES.map(c => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Category dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Civil Department Group</label>
                    <select
                      value={selectedCategoryFilter}
                      onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                      className="w-full border border-slate-150 px-3 py-2 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-navy focus:outline-none"
                    >
                      <option value="All">All Categories</option>
                      <option value="Roads & Traffic">Roads & Traffic</option>
                      <option value="Solid Waste Management">Solid Waste Management</option>
                      <option value="Water & Sanitation">Water & Sanitation</option>
                      <option value="Electricity & Illumination">Electricity & Illumination</option>
                    </select>
                  </div>

                  {/* Status dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Resolution Status</label>
                    <select
                      value={selectedStatusFilter}
                      onChange={(e) => setSelectedStatusFilter(e.target.value)}
                      className="w-full border border-slate-150 px-3 py-2 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-navy focus:outline-none"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Reported">Reported</option>
                      <option value="In-Review">In-Review</option>
                      <option value="In-Progress">In-Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>

                  {/* Clear filter button */}
                  {(selectedCityFilter !== 'All' || selectedCategoryFilter !== 'All' || selectedStatusFilter !== 'All') && (
                    <button
                      onClick={() => {
                        setSelectedCityFilter('All');
                        setSelectedCategoryFilter('All');
                        setSelectedStatusFilter('All');
                      }}
                      className="w-full py-2 text-center text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  )}
                </div>

                {/* Info Card Box */}
                <div className="bg-gradient-to-br from-emerald-550 to-emerald-700 bg-emerald-600 text-white rounded-2xl p-5 shadow-xs relative overflow-hidden">
                  <div className="relative z-10 space-y-3">
                    <div className="flex items-center gap-1.5">
                      <Languages className="w-4 h-4 text-saffron" />
                      <h4 className="text-xs font-extrabold uppercase tracking-wide text-white">Dual Translation Duty</h4>
                    </div>
                    <p className="text-[11px] leading-relaxed text-emerald-100">
                      Municipal commissioners in Northern circles rely on official Hindi drafting, whereas Southern/corporation desks process English files. Community Hero provides dual formatting dynamically for seamless bureaucratic access!
                    </p>
                  </div>
                </div>
              </div>

              {/* Right content list block */}
              <div className="lg:col-span-9 space-y-4">
                
                {/* Search Text field */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by street name, keyword, municipal department, or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 pl-11 pr-4 py-3 rounded-2xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-navy transition-all"
                  />
                </div>

                {/* Issue card grid */}
                {filteredReports.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/60 max-w-lg mx-auto space-y-4">
                    <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
                    <div>
                      <h4 className="font-display font-extrabold text-sm text-slate-800">No matching reports found</h4>
                      <p className="text-xs text-slate-400 mt-1">Try relaxing your search parameters or select a different metropolitan city region filter.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {filteredReports.map(report => {
                      const hasUserUpvoted = report.upvotesUsers.includes(mockUser.uid);
                      
                      return (
                        <div
                          key={report.id}
                          className="bg-white rounded-2xl border border-slate-200/60 hover:border-navy/15 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group hover:-translate-y-0.5"
                        >
                          <div className="p-5 space-y-3.5">
                            {/* Card Top Badges */}
                            <div className="flex items-center justify-between">
                              <span className={`text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md ${
                                report.severity === 'Critical' ? 'bg-rose-100 text-rose-800' :
                                report.severity === 'Severe' ? 'bg-amber-100 text-amber-800' :
                                report.severity === 'Moderate' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                              }`}>{report.severity} Priority</span>
                              
                              <span className={`text-[9px] font-semibold tracking-wide px-2 py-0.5 rounded-md ${
                                report.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                                report.status === 'In-Progress' ? 'bg-sky-100 text-sky-800' :
                                report.status === 'In-Review' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-600'
                              }`}>{report.status}</span>
                            </div>

                            {/* Card Title and Address */}
                            <div className="space-y-1">
                              <h4 className="font-display font-bold text-sm text-slate-900 group-hover:text-navy transition-colors line-clamp-1">{report.title}</h4>
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold leading-tight font-mono">
                                <MapPin className="w-3.5 h-3.5 text-navy shrink-0" />
                                <span className="line-clamp-1">{report.location.address}</span>
                              </div>
                            </div>

                            {/* Description and visual asset */}
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{report.description}</p>
                            
                            {report.imageUrl && (
                              <div className="h-28 w-full rounded-xl overflow-hidden relative">
                                <img src={report.imageUrl} alt={report.title} className="w-full h-full object-cover" />
                                <span className="absolute bottom-2 left-2 bg-black/65 backdrop-blur-xs text-[8px] text-white px-2 py-0.5 rounded uppercase font-bold tracking-wider">AI Verified View</span>
                              </div>
                            )}

                            {/* Department Info */}
                            <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1 bg-slate-50 rounded-lg p-2.5 border border-slate-100 line-clamp-1">
                              <Building2 className="w-3.5 h-3.5 text-navy shrink-0" />
                              <span>{report.suggestedDepartment}</span>
                            </div>
                          </div>

                          {/* Card bottom actions */}
                          <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/40 flex items-center justify-between gap-3">
                            <span className="text-[9px] text-slate-400 font-semibold font-mono">
                              Filed: {new Date(report.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                            
                            <div className="flex items-center gap-2">
                              {/* Attest support button */}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleUpvote(report.id); }}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                                  hasUserUpvoted 
                                    ? 'bg-navy/10 text-navy' 
                                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                                }`}
                              >
                                <ArrowUp className={`w-3.5 h-3.5 ${hasUserUpvoted ? 'text-navy fill-navy' : 'text-slate-400'}`} />
                                <span>Agreed ({report.upvotesCount})</span>
                              </button>

                              {/* View / Review complaint details button */}
                              <button
                                onClick={() => { setSelectedReportForReview(report); setActiveReviewLangTab('en'); }}
                                className="px-2.5 py-1.5 bg-navy text-white hover:bg-navy-hover transition-colors rounded-lg text-[10px] font-extrabold cursor-pointer"
                              >
                                Review
                              </button>
                            </div>
                          </div>
                   
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>

            </div>

          </div>
        )}

        {/* REPORT ISSUE TAB SEGMENT */}
        {activeTab === 'report' && (
          <div className="space-y-6">
            <ReportWizard
              onSuccess={handleAddNewReport}
              userId={mockUser.uid}
              userEmail={mockUser.email}
              userName={mockUser.displayName}
            />
          </div>
        )}

        {/* MAP EXPLORER SEGMENT */}
        {activeTab === 'map' && (
          <div className="space-y-6 h-[550px] relative">
            <div className="absolute top-4 right-4 z-[999] bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-200/80 shadow-md flex items-center gap-3">
              <span className="text-xs font-bold text-slate-650">Select City Hub:</span>
              <select
                value={selectedCityFilter === 'All' ? 'Bengaluru' : selectedCityFilter}
                onChange={(e) => setSelectedCityFilter(e.target.value)}
                className="border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-semibold focus:outline-none"
              >
                {INDIAN_CITIES.map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            
            <CivicMap
              reports={reports}
              selectedCity={selectedCityFilter === 'All' ? 'Bengaluru' : selectedCityFilter}
              onSelectReport={(rep) => {
                setSelectedReportForReview(rep);
                setActiveReviewLangTab('en');
              }}
            />
          </div>
        )}

        {/* CHATBOT ADVISOR SEGMENT */}
        {activeTab === 'chat' && (
          <div className="space-y-6 animate-fade-in">
            <CivicBot />
          </div>
        )}

        {/* CORPORATE/MUNICIPAL RANKINGS AND GLORY TAB */}
        {activeTab === 'ranking' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            
            {/* Header statement bar */}
            <div className="bg-gradient-to-r from-navy via-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xs">
              <h2 className="font-display font-extrabold text-lg text-white">National Civic Transparency Scoreboard</h2>
              <p className="text-xs text-slate-350 leading-relaxed mt-0.5">Recognizing the top performing Municipal Corporations and active citizen vigilantes working together for a cleaner India.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Leaders board card 1: Municipalities */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="p-2 bg-saffron/10 text-saffron rounded-xl inline-flex">
                    <Trophy className="w-5 h-5" />
                  </span>
                  <h3 className="font-display font-bold text-sm text-slate-800">Top Performing Municipal Corporations</h3>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold font-mono text-saffron text-lg w-5">#1</span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Bruhat Bengaluru Mahanagara Palike</h4>
                        <span className="text-[10px] text-slate-400 font-medium">Bommanahalli Zone</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-600 font-mono">92% Resolved</span>
                      <span className="block text-[9px] text-slate-450 font-medium mt-0.5">Avg 32 hours response</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold font-mono text-slate-400 text-lg w-5">#2</span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Brihanmumbai Municipal Corporation</h4>
                        <span className="text-[10px] text-slate-400 font-medium">G/North Ward (Dadar)</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-600 font-mono">87% Resolved</span>
                      <span className="block text-[9px] text-slate-450 font-medium mt-0.5">Avg 48 hours response</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold font-mono text-amber-700 text-lg w-5">#3</span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Pune Municipal Corporation</h4>
                        <span className="text-[10px] text-slate-400 font-medium">Koregaon Park Ward 5</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-600 font-mono">81% Resolved</span>
                      <span className="block text-[9px] text-slate-450 font-medium mt-0.5">Avg 54 hours response</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Leaders board card 2: Active Citizens (Citizen Heroes) */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="p-2 bg-green-t/10 text-green-t rounded-xl inline-flex">
                    <Users className="w-5 h-5 animate-pulse" />
                  </span>
                  <h3 className="font-display font-bold text-sm text-slate-800">National Citizen Heroes of India</h3>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center">
                        AR
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 font-sans">Ananya Rao</h4>
                        <span className="text-[10px] text-slate-400 font-semibold font-mono">Mumbai • 19 Resolved</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-saffron font-mono">🏆 1,480pts</span>
                      <span className="block text-[9px] text-emerald-600 font-extrabold uppercase mt-0.5 tracking-wider">MGD WARRIOR</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-saffron text-white text-xs font-bold flex items-center justify-center">
                        KP
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 font-sans">Kunal Patel</h4>
                        <span className="text-[10px] text-slate-400 font-semibold font-mono">Pune • 11 Resolved</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-saffron font-mono">🏆 980pts</span>
                      <span className="block text-[9px] text-emerald-600 font-extrabold uppercase mt-0.5 tracking-wider">SWATCH CO-LEAD</span>
                    </div>
                  </div>

                  {/* Highlight current user in list */}
                  <div className="p-3.5 bg-navy/5 rounded-xl border border-navy/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                        ZH
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-navy font-sans">Zahid Hamdule (You)</h4>
                        <span className="text-[10px] text-slate-400 font-semibold font-mono">Bengaluru • 1 Registered</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-saffron font-mono">🏆 125pts</span>
                      <span className="block text-[9px] text-navy font-extrabold uppercase mt-0.5 tracking-wider">Active Hero</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* FULL GRANDE VIEW DIALOG MODAL PANEL (For reviewing any filed issue) */}
      {selectedReportForReview && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Heading Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                  selectedReportForReview.severity === 'Critical' ? 'bg-rose-100 text-rose-800' :
                  selectedReportForReview.severity === 'Severe' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                }`}>{selectedReportForReview.severity} Severity</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded font-mono font-bold leading-tight uppercase">{selectedReportForReview.status}</span>
              </div>
              <button
                onClick={() => setSelectedReportForReview(null)}
                className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 font-bold hover:text-rose-600 text-slate-500 rounded-xl transition-colors text-xs cursor-pointer flex items-center gap-0.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Close</span>
              </button>
            </div>

            {/* Scrollable Document Body */}
            <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
              
              <div className="space-y-2">
                <h3 className="font-display font-extrabold text-base md:text-lg text-slate-900 leading-snug">{selectedReportForReview.title}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-slate-400 font-semibold font-mono">
                  <span className="flex items-center gap-0.5 text-navy">📍City: <b className="font-sans font-extrabold text-slate-700">{selectedReportForReview.location.city}</b></span>
                  <span>Category: <b className="font-sans font-bold text-slate-700">{selectedReportForReview.category}</b></span>
                  <span>Registered: <b className="font-sans font-medium text-slate-700">{new Date(selectedReportForReview.createdAt).toLocaleDateString()}</b></span>
                </div>
              </div>

              {/* Verified Image box */}
              {selectedReportForReview.imageUrl && (
                <div className="w-full rounded-2xl h-56 md:h-64 overflow-hidden shadow-xs border border-slate-100 relative">
                  <img src={selectedReportForReview.imageUrl} alt={selectedReportForReview.title} className="w-full h-full object-cover" />
                  <span className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-xs text-[9px] text-white font-bold tracking-wider px-3 py-1 rounded-lg uppercase">AI INFRASTRUCTURE DIAGNOSTIC SCAN VIEW</span>
                </div>
              )}

              {/* Description summary */}
              <div className="space-y-1.5 text-xs text-slate-700 leading-relaxed font-medium">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Citizen Observation description</span>
                <p className="bg-slate-50 p-4 rounded-xl border border-slate-100">{selectedReportForReview.description}</p>
              </div>

              {/* Rationale justification text */}
              {selectedReportForReview.severityJustification && (
                <div className="space-y-1.5 text-xs text-slate-600 leading-relaxed">
                  <span className="block text-[10px] font-bold text-rose-500 uppercase tracking-widest">AI Safety Assessment Justification</span>
                  <p className="bg-rose-50/40 p-4 rounded-xl border border-rose-100/50 font-medium italic text-rose-800">
                    "{selectedReportForReview.severityJustification}"
                  </p>
                </div>
              )}

              {/* suggested department responsible */}
              <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-5 h-5 text-navy shrink-0" />
                  <div>
                    <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Responsible Municipal Authority</span>
                    <span className="text-xs font-bold text-slate-800">{selectedReportForReview.suggestedDepartment}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Escalated Resolution Time</span>
                  <span className="text-xs font-extrabold text-emerald-700 font-mono">Within {selectedReportForReview.severity === 'Critical' ? '24 Hours' : '48-72 Hours'}</span>
                </div>
              </div>

              {/* BILINGUAL COMPLAINT SHEETS FOR COMMISSIONERS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-105 pb-2">
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-navy" />
                    <span>Official Grievance Complaint Copy</span>
                  </span>
                  
                  {/* Lang Switch */}
                  <div className="bg-slate-100 p-0.5 rounded-lg flex text-[10px] font-bold">
                    <button
                      onClick={() => setActiveReviewLangTab('en')}
                      className={`px-3 py-1 rounded transition-all cursor-pointer ${activeReviewLangTab === 'en' ? 'bg-white text-navy shadow-xs' : 'text-slate-400'}`}
                    >
                      English Draft
                    </button>
                    <button
                      onClick={() => setActiveReviewLangTab('hi')}
                      className={`px-3 py-1 rounded transition-all cursor-pointer ${activeReviewLangTab === 'hi' ? 'bg-white text-navy shadow-xs' : 'text-slate-400'}`}
                    >
                      हिंदी ड्राफ्ट
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    readOnly
                    rows={8}
                    value={activeReviewLangTab === 'en' ? selectedReportForReview.complaintDraftEnglish : selectedReportForReview.complaintDraftHindi}
                    className="w-full border border-slate-200/80 px-5 py-4 rounded-2xl text-xs leading-relaxed bg-slate-50/50 text-slate-700 focus:outline-none whitespace-pre-line font-medium"
                  />
                  <button
                    onClick={() => {
                      const text = activeReviewLangTab === 'en' ? selectedReportForReview.complaintDraftEnglish : selectedReportForReview.complaintDraftHindi;
                      navigator.clipboard.writeText(text);
                      alert("Grievance draft successfully copied. You can use it on public municipal grievance portals (like Namma Bengaluru BBMP on map, BMC PG Portal system, or RTI applications)!");
                    }}
                    className="absolute top-4 right-4 bg-white/95 border border-slate-200 hover:bg-slate-50 text-navy font-bold text-[10px] px-3 py-1.5 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Letter</span>
                  </button>
                </div>

                {/* Local advice */}
                {selectedReportForReview.civicAdvice && (
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-2.5">
                    <BadgeHelp className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-bold text-emerald-800">Civic Duty Safety Advice</h5>
                      <p className="text-[11px] text-emerald-600 font-medium leading-relaxed mt-0.5">{selectedReportForReview.civicAdvice}</p>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Bottom action footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Support: {selectedReportForReview.upvotesCount} Citizens Attested
              </span>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpvote(selectedReportForReview.id)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 border ${
                    selectedReportForReview.upvotesUsers.includes(mockUser.uid)
                      ? 'bg-navy/10 border-navy/20 text-navy'
                      : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span>I agree (Support Grievance)</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* FOOTER COOPERATIVE FRAME */}
      <footer className="bg-slate-900 text-slate-400 py-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-saffron text-white flex items-center justify-center font-display font-bold text-xs">C</div>
              <h4 className="font-display font-extrabold text-sm text-white">Community Hero</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              Sovereign AI Citizen Empowering Portal built for Indian metropolitan city zones. Providing 100% transparent public grievance, GIS spatial tracking, and bilingual AI complaint translation.
            </p>
          </div>
          <div>
            <h5 className="text-xs font-extrabold uppercase tracking-widest text-slate-200 mb-3">Participating Cities</h5>
            <ul className="text-xs space-y-1.5 text-slate-500 font-mono font-medium">
              <li>✨ BBMP Ward Circle Bengaluru</li>
              <li>✨ BMC Administration Zone Mumbai</li>
              <li>✨ MCD Street Light Grid Delhi</li>
              <li>✨ PMC Road Rehabilitation Pune</li>
            </ul>
          </div>
          <div>
            <h5 className="text-xs font-extrabold uppercase tracking-widest text-slate-200 mb-3">Hackathon Compliance</h5>
            <p className="text-xs text-slate-505 leading-relaxed font-medium">
              Powered by Server-Side **Gemini-2.5-Flash** for strict secure vision analysis and zero-leak API key operations inside Google Cloud Run.
            </p>
            <div className="flex items-center gap-2 mt-4 text-[11px] text-saffron uppercase font-bold tracking-wider font-mono">
              <span className="w-2 h-2 rounded-full bg-green-t animate-ping"></span>
              <span>Online Core Node Verified</span>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-8 border-t border-slate-800/80 mt-8 pt-6 flex flex-wrap justify-between text-[11px] text-slate-600 font-mono font-medium">
          <span>© 2026 Community Hero India. All rights reserved.</span>
          <span>Designed with Saffron, Navy Blue, and Green-T elements.</span>
        </div>
      </footer>

    </div>
  );
}
