"use client";

import { useState, useEffect, useRef } from "react"
import {
  LayoutDashboard, Package, Wallet, Truck, Users, FileText,
  Settings, Mic, Send, AlertTriangle, Plus, Search,
  Bot, User, CheckCircle2, X, BarChart3, Receipt, FileSpreadsheet,
  BookOpen, Bell, Globe, LogOut, PanelLeftClose, PanelLeftOpen,
  Lock, ArrowRight, WifiOff, Sun, Moon
} from "lucide-react"
import { Button } from "@/components/shadcn_ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn_ui/card"
import { Input } from "@/components/shadcn_ui/input"
import { Textarea } from "@/components/shadcn_ui/textarea"
import { Badge } from "@/components/shadcn_ui/badge"
import { Avatar, AvatarFallback } from "@/components/shadcn_ui/avatar"
import { ScrollArea } from "@/components/shadcn_ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn_ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/shadcn_ui/dialog"
import { Label } from "@/components/shadcn_ui/label"

interface MessageAction {
  item: string;
  qty: string;
  action: string;
}

interface Message {
  id: number;
  role: string;
  text: string;
  language: string | null;
  action: MessageAction | null;
}

type LangLevel = "en" | "hi-essential" | "hi-full" | "ta";

// --- LOCALIZATION DICTIONARY (EN, HI, TA) ---
const uiTranslations = {
  "en": {
    langLabel: "EN",
    main: "MAIN", dashboard: "Dashboard", inventory: "Inventory", sales: "Sales", khata: "Khata (Udhaar)", orders: "Orders",
    business: "BUSINESS", suppliers: "Suppliers", reports: "Reports", settings: "Settings", search: "Search apps or data...",
    sysOverview: "System Overview", invController: "Inventory Controller", salesFinance: "Sales & Finance",
    manageStock: "Manage Stock", lowStock: "Low Stock Alerts", createPo: "Create Purchase Order", supplierLedger: "Supplier Ledger", stockRecon: "Stock Reconciliation",
    todaySales: "Today's Sales", manualSale: "Record Manual Sale", monthlyRev: "Monthly Revenue", pendingRec: "Pending Receivables",
    masterInv: "Master Inventory", invDesc: "Manage your product catalog and stock levels.", addItem: "Add Item Manually",
    khataTitle: "Khata (Customer Ledger)", khataDesc: "Track pending payments and customer credit (Udhaar).", newCust: "New Customer",
    totOut: "Total Outstanding", activeAcc: "Active Khata Accounts", recThisWeek: "Recovered This Week",
    recSales: "Recent Sales", recSalesDesc: "Live stream of all transactions.", recSaleBtn: "Record Sale",
    underDev: "module is currently under development.", checkBack: "Check back later or use the AI Agent for tasks."
  },
  "hi-essential": {
    langLabel: "HI (PARTIAL)",
    main: "मुख्य (MAIN)", dashboard: "डैशबोर्ड", inventory: "स्टॉक (Inventory)", sales: "बिक्री (Sales)", khata: "खाता (Ledger)", orders: "ऑर्डर (Orders)",
    business: "व्यापार (BUSINESS)", suppliers: "सप्लायर (Suppliers)", reports: "रिपोर्ट (Reports)", settings: "सेटिंग्स", search: "खोजें (Search)...",
    sysOverview: "सिस्टम अवलोकन (System Overview)", invController: "Inventory Controller", salesFinance: "Sales & Finance",
    manageStock: "Manage Stock", lowStock: "Low Stock Alerts", createPo: "Create Purchase Order", supplierLedger: "Supplier Ledger", stockRecon: "Stock Reconciliation",
    todaySales: "Today's Sales", manualSale: "Record Manual Sale", monthlyRev: "Monthly Revenue", pendingRec: "Pending Receivables",
    masterInv: "Master Inventory", invDesc: "Manage your product catalog and stock levels.", addItem: "Add Item Manually",
    khataTitle: "Khata (Customer Ledger)", khataDesc: "Track pending payments and customer credit (Udhaar).", newCust: "New Customer",
    totOut: "Total Outstanding", activeAcc: "Active Khata Accounts", recThisWeek: "Recovered This Week",
    recSales: "Recent Sales", recSalesDesc: "Live stream of all transactions.", recSaleBtn: "Record Sale",
    underDev: "मॉड्यूल अभी विकास में है। (under development)", checkBack: "बाद में देखें या एआई एजेंट का उपयोग करें।"
  },
  "hi-full": {
    langLabel: "HI (FULL)",
    main: "मुख्य", dashboard: "डैशबोर्ड", inventory: "स्टॉक / इन्वेंटरी", sales: "बिक्री", khata: "खाता (उधार)", orders: "ऑर्डर",
    business: "व्यापार", suppliers: "सप्लायर", reports: "रिपोर्ट", settings: "सेटिंग्स", search: "ऐप्स या डेटा खोजें...",
    sysOverview: "सिस्टम अवलोकन", invController: "स्टॉक नियंत्रण", salesFinance: "बिक्री और वित्त",
    manageStock: "स्टॉक प्रबंधित करें", lowStock: "कम स्टॉक अलर्ट", createPo: "खरीद आदेश (PO) बनाएं", supplierLedger: "सप्लायर लेजर", stockRecon: "स्टॉक मिलान",
    todaySales: "आज की बिक्री", manualSale: "मैनुअल सेल दर्ज करें", monthlyRev: "मासिक आय", pendingRec: "लंबित प्राप्तियां",
    masterInv: "मुख्य इन्वेंटरी", invDesc: "अपने उत्पाद कैटलॉग और स्टॉक स्तरों का प्रबंधन करें।", addItem: "नया उत्पाद जोड़ें",
    khataTitle: "खाता (ग्राहक लेजर)", khataDesc: "लंबित भुगतान और ग्राहक उधारी ट्रैक करें।", newCust: "नया ग्राहक",
    totOut: "कुल बकाया", activeAcc: "सक्रिय खाते", recThisWeek: "इस सप्ताह वसूली",
    recSales: "हाल की बिक्री", recSalesDesc: "सभी लेनदेन की लाइव स्ट्रीम।", recSaleBtn: "सेल दर्ज करें",
    underDev: "मॉड्यूल अभी विकास में है।", checkBack: "बाद में देखें या कार्यों के लिए एआई एजेंट का उपयोग करें।"
  },
  "ta": {
    langLabel: "TA",
    main: "முக்கிய (MAIN)", dashboard: "டாஷ்போர்டு", inventory: "சரக்கு (Inventory)", sales: "விற்பனை (Sales)", khata: "கணக்கு (Khata)", orders: "ஆர்டர்கள் (Orders)",
    business: "வணிகம் (BUSINESS)", suppliers: "சப்ளையர்கள் (Suppliers)", reports: "அறிக்கைகள் (Reports)", settings: "அமைப்புகள் (Settings)", search: "தேடுங்கள் (Search)...",
    sysOverview: "கணினி கண்ணோட்டம்", invController: "சரக்கு கட்டுப்படுத்தி", salesFinance: "விற்பனை & நிதி",
    manageStock: "சரக்குகளை நிர்வகி", lowStock: "குறைந்த சரக்கு", createPo: "கொள்முதல் ஆணை (PO)", supplierLedger: "சப்ளையர் லெட்ஜர்", stockRecon: "சரக்கு சமரசம்",
    todaySales: "இன்றைய விற்பனை", manualSale: "கைமுறை விற்பனை", monthlyRev: "மாத வருவாய்", pendingRec: "நிலுவையில் உள்ளவை",
    masterInv: "முதன்மை சரக்கு", invDesc: "உங்கள் தயாரிப்புகள் மற்றும் சரக்குகளை நிர்வகிக்கவும்.", addItem: "பொருளைச் சேர்",
    khataTitle: "கணக்கு (வாடிக்கையாளர் லெட்ஜர்)", khataDesc: "நிலுவையில் உள்ள கொடுப்பனவுகள் மற்றும் கடன்களைக் கண்காணிக்கவும்.", newCust: "புதிய வாடிக்கையாளர்",
    totOut: "மொத்த நிலுவை", activeAcc: "செயலில் உள்ள கணக்குகள்", recThisWeek: "இந்த வாரம் வசூலானது",
    recSales: "சமீபத்திய விற்பனை", recSalesDesc: "அனைத்து பரிவர்த்தனைகளின் நேரடி ஸ்ட்ரீம்.", recSaleBtn: "விற்பனையை பதிவு செய்",
    underDev: "தொகுதி தற்போது உருவாக்கத்தில் உள்ளது.", checkBack: "பின்னர் பார்க்கவும் அல்லது AI ஐப் பயன்படுத்தவும்."
  }
};

export default function Dashboard() {
  // --- CORE APP STATES ---
  const [theme, setTheme] = useState<"dark" | "light">("dark"); // Theme State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const [activeTab, setActiveTab] = useState("dashboard");
  const [language, setLanguage] = useState<LangLevel>("en");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const t = uiTranslations[language];

  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Header Dropdown States
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // --- MOCK STATE DATA ---
  const [stats, setStats] = useState({
    todaySales: "₹8,240", salesTrend: "+12%", totalItems: 142,
    lowStock: 3, pendingOrders: 7, monthlyRev: "₹1.2L"
  });

  const [inventoryList, setInventoryList] = useState([
    { sku: "LUX-50G", name: "Lux Soap 50g", stock: 98, price: "₹15", status: "Healthy" },
    { sku: "DOV-75G", name: "Dove Soap 75g", stock: 8, price: "₹32", status: "Low Stock" },
    { sku: "MAG-100G", name: "Maggi Noodles 100g", stock: 45, price: "₹14", status: "Healthy" },
    { sku: "TAT-1KG", name: "Tata Salt 1kg", stock: 12, price: "₹24", status: "Warning" },
    { sku: "COL-150G", name: "Colgate MaxFresh 150g", stock: 2, price: "₹90", status: "Low Stock" },
  ]);

  const [khataList, setKhataList] = useState([
    { id: 1, name: "Ramesh Sharma", phone: "+91 98765 43210", balance: "₹1,250", lastActive: "Today, 10:30 AM", status: "Pending" },
    { id: 2, name: "Suresh Tea Stall", phone: "+91 87654 32109", balance: "₹4,500", lastActive: "Yesterday", status: "Overdue" },
    { id: 3, name: "Anita Devi", phone: "+91 76543 21098", balance: "₹320", lastActive: "3 days ago", status: "Pending" },
  ]);

  const [salesList, setSalesList] = useState([
    { id: "INV-1042", items: "Lux Soap (x5), Tata Salt (x2)", total: "₹123", type: "Cash", time: "10 mins ago" },
    { id: "INV-1041", items: "Maggi Noodles (x10)", total: "₹140", type: "Khata (Ramesh)", time: "1 hour ago" },
    { id: "INV-1040", items: "Colgate MaxFresh (x1)", total: "₹90", type: "UPI", time: "2 hours ago" },
  ]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1, role: "system",
      text: "Namaste! 3 items need restocking today. Dove Soap is down to 8 units. Should I order more?",
      language: null, action: null
    }
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAgentOpen, isTyping]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const cycleLanguage = () => {
    if (language === "en") setLanguage("hi-essential");
    else if (language === "hi-essential") setLanguage("hi-full");
    else if (language === "hi-full") setLanguage("ta");
    else setLanguage("en");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userText = inputText.trim();
    const newUserMsg: Message = { id: Date.now(), role: "user", text: userText, language: "Hinglish", action: null };

    setMessages(prev => [...prev, newUserMsg]);
    setInputText("");
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const lowerText = userText.toLowerCase();
      let mockResponse: Message;

      if (lowerText.includes("sales") || lowerText.includes("bikri")) {
        mockResponse = { id: Date.now() + 1, role: "agent", text: `Aaj ki total sales ${stats.todaySales} hai. Pichle din se ${stats.salesTrend} zyada!`, language: null, action: null };
      } else if (lowerText.includes("lux") || lowerText.includes("add")) {
        mockResponse = { id: Date.now() + 1, role: "agent", text: "Samajh gaya! Main stock update kar deta hun. Please confirm karein:", language: null, action: { item: "Lux Soap 50g", qty: "+50", action: "ADD STOCK" } };
      } else {
        mockResponse = { id: Date.now() + 1, role: "agent", text: "Ji, main detail check kar raha hun. Aapko kuch specific dekhna hai?", language: null, action: null };
      }
      setMessages(prev => [...prev, mockResponse]);
    }, 1500);
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case "dashboard": return t.sysOverview;
      case "inventory": return t.inventory;
      case "sales": return t.sales;
      case "khata": return t.khata;
      case "orders": return t.orders;
      case "suppliers": return t.suppliers;
      case "reports": return t.reports;
      case "settings": return t.settings;
      default: return activeTab;
    }
  };

  // ==========================================
  // VIEW: LOGIN GATEWAY
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className={theme === 'dark' ? 'dark' : ''}>
        <div
          className="flex h-screen bg-zinc-50 dark:bg-zinc-950 items-center justify-center font-sans relative overflow-hidden transition-colors duration-500"
          onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
        >
          {/* Theme Toggle Floating Button */}
          <button
            onClick={toggleTheme}
            className="absolute top-8 right-8 p-3 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 shadow-md hover:scale-110 transition-transform z-20"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Ambient Glow Mouse Trailer Effect */}
          <div
            className="absolute w-[600px] h-[600px] bg-indigo-600/10 dark:bg-indigo-600/20 rounded-full blur-[100px] dark:blur-[120px] pointer-events-none transition-all duration-500 ease-out z-0"
            style={{
              left: mousePos.x === 0 && mousePos.y === 0 ? '50%' : `${mousePos.x}px`,
              top: mousePos.x === 0 && mousePos.y === 0 ? '50%' : `${mousePos.y}px`,
              transform: 'translate(-50%, -50%)'
            }}
          ></div>

          <Card className="w-[400px] bg-white/90 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 shadow-2xl z-10 backdrop-blur-xl">
            <CardHeader className="text-center pb-6 border-b border-zinc-100 dark:border-zinc-800/50">
              <div className="mx-auto w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-4 border border-indigo-500/20">
                <Lock className="text-indigo-600 dark:text-indigo-400 w-6 h-6" />
              </div>
              <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Bazaar<span className="text-indigo-600 dark:text-indigo-500">OS</span></CardTitle>
              <CardDescription className="text-zinc-500 dark:text-zinc-400">Secure access for your enterprise.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-700 dark:text-zinc-300">Store ID / Phone Number</Label>
                  <Input id="email" placeholder="+91 98765 43210" className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus-visible:ring-indigo-500" defaultValue="ravi.store@linguaverse.in" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-zinc-700 dark:text-zinc-300">Password / OTP</Label>
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline">Send OTP</span>
                  </div>
                  <Input id="password" type="password" placeholder="••••••••" className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus-visible:ring-indigo-500" defaultValue="password123" />
                </div>
                <Button
                  onClick={() => setIsAuthenticated(true)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 text-white mt-2 group py-6 text-md font-semibold"
                >
                  Secure Login <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <div className="text-center">
                  <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">Hackathon Demo: Just click login to proceed.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ==========================================
  // VIEW: MAIN APPLICATION DASHBOARD
  // ==========================================
  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-300 font-sans overflow-hidden relative transition-colors duration-300">

        {/* Ambient Glow Effect (Subtle for Main Dashboard) */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 dark:bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

        {/* ================= LEFT SIDEBAR ================= */}
        <aside className={`z-10 ${isSidebarCollapsed ? 'w-20' : 'w-64'} border-r border-zinc-200 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-900/50 flex flex-col shrink-0 transition-all duration-300 ease-in-out`}>
          <div className={`p-4 pb-2 border-b border-zinc-200 dark:border-zinc-800/60 mb-4 flex ${isSidebarCollapsed ? 'flex-col items-center gap-4' : 'items-start justify-between'}`}>
            {!isSidebarCollapsed ? (
              <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Bazaar<span className="text-indigo-600 dark:text-indigo-500">OS</span></h1>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1 mb-2">Multilingual ERP</p>
              </div>
            ) : (
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight mt-2">B<span className="text-indigo-600 dark:text-indigo-500">OS</span></h1>
            )}

            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
              title="Toggle Sidebar"
            >
              {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>

          <nav className="flex-1 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
            {isSidebarCollapsed ? (
              <div className="h-px bg-zinc-200 dark:bg-zinc-800/60 w-8 mx-auto my-4"></div>
            ) : (
              <p className="text-xs font-semibold text-zinc-500 mb-2 mt-2 px-3">{t.main}</p>
            )}
            <NavItem icon={<LayoutDashboard size={18} />} label={t.dashboard} active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} isCollapsed={isSidebarCollapsed} />
            <NavItem icon={<Package size={18} />} label={t.inventory} alert active={activeTab === "inventory"} onClick={() => setActiveTab("inventory")} isCollapsed={isSidebarCollapsed} />
            <NavItem icon={<Wallet size={18} />} label={t.sales} active={activeTab === "sales"} onClick={() => setActiveTab("sales")} isCollapsed={isSidebarCollapsed} />
            <NavItem icon={<BookOpen size={18} />} label={t.khata} active={activeTab === "khata"} onClick={() => setActiveTab("khata")} isCollapsed={isSidebarCollapsed} />
            <NavItem icon={<Truck size={18} />} label={t.orders} active={activeTab === "orders"} onClick={() => setActiveTab("orders")} isCollapsed={isSidebarCollapsed} />

            {isSidebarCollapsed ? (
              <div className="h-px bg-zinc-200 dark:bg-zinc-800/60 w-8 mx-auto my-6"></div>
            ) : (
              <p className="text-xs font-semibold text-zinc-500 mb-2 mt-6 px-3">{t.business}</p>
            )}
            <NavItem icon={<Users size={18} />} label={t.suppliers} active={activeTab === "suppliers"} onClick={() => setActiveTab("suppliers")} isCollapsed={isSidebarCollapsed} />
            <NavItem icon={<FileText size={18} />} label={t.reports} active={activeTab === "reports"} onClick={() => setActiveTab("reports")} isCollapsed={isSidebarCollapsed} />
            <NavItem icon={<Settings size={18} />} label={t.settings} active={activeTab === "settings"} onClick={() => setActiveTab("settings")} isCollapsed={isSidebarCollapsed} />
          </nav>
        </aside>

        {/* ================= CENTER PANEL ================= */}
        <main className="flex-1 flex flex-col min-w-0 bg-transparent relative z-10">

          {/* Offline Banner Indicator */}
          {isOffline && (
            <div className="w-full bg-rose-600 dark:bg-rose-500/90 text-white text-xs font-bold text-center py-1 flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
              <WifiOff size={14} /> Working Offline - Local changes will sync automatically when connection is restored.
            </div>
          )}

          {/* ================= GLOBAL TOP HEADER ================= */}
          <header className={`h-20 border-b border-zinc-200 dark:border-zinc-800/60 px-8 flex items-center justify-between shrink-0 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10`}>

            <div className="flex items-center gap-4 flex-1">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white capitalize shrink-0 hidden lg:block transition-all mr-2">{getPageTitle()}</h2>
              <div className="relative hidden md:block w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 w-4 h-4 z-10" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder={t.search}
                  className="peer pl-9 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-300 rounded-full focus-visible:ring-indigo-500 h-10 text-sm w-full transition-all focus:w-[28rem] shadow-sm dark:shadow-none"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1 peer-focus:opacity-0 pointer-events-none transition-opacity duration-200">
                  <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-1.5 font-mono text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Ctrl K</kbd>
                </div>
              </div>
            </div>

            {/* Right: Actions & Profile */}
            <div className="flex items-center gap-6">

              {/* Action Icons */}
              <div className="flex items-center gap-4 border-r border-zinc-200 dark:border-zinc-800 pr-6">
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors p-2"
                  title="Toggle Light/Dark Mode"
                >
                  {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                {/* Language Toggle */}
                <button
                  onClick={cycleLanguage}
                  className={`transition-colors flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-full border ${language === 'en' ? 'border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400' : 'border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'}`}
                  title="Toggle Language Level"
                >
                  <Globe size={16} />
                  <span className="uppercase text-xs tracking-wider">{t.langLabel}</span>
                </button>

                {/* Notification Bell (Interactive) */}
                <div className="relative">
                  <button onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors relative p-2">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-zinc-50 dark:border-zinc-950"></span>
                  </button>

                  {/* Notification Dropdown */}
                  {isNotifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl dark:shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                      <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
                        <span className="font-semibold text-zinc-900 dark:text-white text-sm">Notifications</span>
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline">Mark all read</span>
                      </div>
                      <div className="p-2">
                        <div className="p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg cursor-pointer transition-colors mb-1">
                          <p className="text-sm text-zinc-700 dark:text-zinc-200"><strong className="text-rose-600 dark:text-rose-400">Low Stock:</strong> Dove Soap 75g is down to 8 units.</p>
                          <p className="text-xs text-zinc-500 mt-1">10 mins ago</p>
                        </div>
                        <div className="p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg cursor-pointer transition-colors">
                          <p className="text-sm text-zinc-700 dark:text-zinc-200"><strong className="text-emerald-600 dark:text-emerald-400">Payment:</strong> Suresh Tea Stall settled ₹4,500 due.</p>
                          <p className="text-xs text-zinc-500 mt-1">1 hour ago</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Menu (Interactive) */}
              <div className="relative">
                <div onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }} className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                  <div
                    className="text-right hidden sm:block"
                    title="Click Network Status to toggle Offline Mode"
                    onClick={(e) => { e.stopPropagation(); setIsOffline(!isOffline); }}
                  >
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white leading-tight">Ravi Store</p>
                    <p className={`text-xs font-bold ${isOffline ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {isOffline ? 'Offline' : 'Online'}
                    </p>
                  </div>
                  <Avatar className="w-10 h-10 rounded-full border-2 border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 transition-colors">
                    <AvatarFallback className="bg-indigo-600 text-white font-bold">R</AvatarFallback>
                  </Avatar>
                </div>

                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl dark:shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">Ravi General Store</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">ravi.store@linguaverse.in</p>
                    </div>
                    <div className="p-2">
                      <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white rounded-md transition-colors">
                        <Settings size={16} /> Shop Settings
                      </button>
                      {/* Logout Button */}
                      <button
                        onClick={() => setIsAuthenticated(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-700 dark:hover:text-rose-300 rounded-md transition-colors mt-1"
                      >
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </header>

          {/* Scrollable Content Area */}
          <ScrollArea
            className="flex-1 p-8"
            onClick={() => { if (isNotifOpen) setIsNotifOpen(false); if (isProfileOpen) setIsProfileOpen(false); }}
          >

            {/* VIEW: DASHBOARD (SAP CARDS) */}
            {activeTab === "dashboard" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-10">
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-4">{t.invController}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    <SapCard title={t.manageStock} subtitle={`${stats.totalItems} Items`} icon={<Package />} onClick={() => setActiveTab("inventory")} />
                    <SapCard title={t.lowStock} subtitle={`${stats.lowStock} Items`} icon={<AlertTriangle />} alert />
                    <SapCard title={t.createPo} icon={<Plus />} />
                    <SapCard title={t.supplierLedger} subtitle="Dues: ₹4,200" icon={<Users />} />
                    <SapCard title={t.stockRecon} icon={<FileSpreadsheet />} />
                  </div>
                </div>

                <div className="mb-10">
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-4">{t.salesFinance}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    <SapCard title={t.todaySales} subtitle={`${stats.todaySales} (${stats.salesTrend})`} icon={<Wallet />} highlight />
                    <SapCard title={t.manualSale} icon={<Receipt />} />
                    <SapCard title={t.monthlyRev} subtitle={stats.monthlyRev} icon={<BarChart3 />} />
                    <SapCard title={t.pendingRec} subtitle={`${stats.pendingOrders} Invoices`} icon={<FileText />} />
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: INVENTORY TABLE */}
            {activeTab === "inventory" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-2xl font-semibold text-zinc-900 dark:text-white">{t.masterInv}</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">{t.invDesc}</p>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                        <Plus className="mr-2 h-4 w-4" /> {t.addItem}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white">
                      <DialogHeader>
                        <DialogTitle>{t.addItem}</DialogTitle>
                        <DialogDescription className="text-zinc-500 dark:text-zinc-400">
                          Manually enter a new product to your inventory ledger. (Hint: It's faster to just tell the AI Agent to do this!)
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="name" className="text-right text-zinc-700 dark:text-zinc-300">Name</Label>
                          <Input id="name" placeholder="e.g. Parle-G 50g" className="col-span-3 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-700" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="sku" className="text-right text-zinc-700 dark:text-zinc-300">SKU</Label>
                          <Input id="sku" placeholder="PAR-50G" className="col-span-3 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-700" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="stock" className="text-right text-zinc-700 dark:text-zinc-300">Stock Qty</Label>
                          <Input id="stock" type="number" placeholder="100" className="col-span-3 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-700" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 text-white">Save Item</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
                  <Table>
                    <TableHeader className="bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                      <TableRow className="border-zinc-200 dark:border-zinc-800">
                        <TableHead className="w-[100px] text-zinc-500 dark:text-zinc-400">SKU</TableHead>
                        <TableHead className="text-zinc-500 dark:text-zinc-400">Product Name</TableHead>
                        <TableHead className="text-zinc-500 dark:text-zinc-400">Status</TableHead>
                        <TableHead className="text-right text-zinc-500 dark:text-zinc-400">Price</TableHead>
                        <TableHead className="text-right text-zinc-500 dark:text-zinc-400">Stock</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryList.map((item) => (
                        <TableRow key={item.sku} className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                          <TableCell className="font-medium text-zinc-900 dark:text-zinc-300">{item.sku}</TableCell>
                          <TableCell className="text-zinc-700 dark:text-white">{item.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`
                              ${item.status === 'Healthy' ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10' : ''}
                              ${item.status === 'Low Stock' ? 'text-rose-600 dark:text-rose-400 border-rose-500/20 bg-rose-50 dark:bg-rose-500/10' : ''}
                              ${item.status === 'Warning' ? 'text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-50 dark:bg-amber-500/10' : ''}
                            `}>
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-zinc-600 dark:text-zinc-300">{item.price}</TableCell>
                          <TableCell className="text-right text-zinc-900 dark:text-white font-medium">{item.stock}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            )}

            {/* VIEW: KHATA (LEDGER) */}
            {activeTab === "khata" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-2xl font-semibold text-zinc-900 dark:text-white">{t.khataTitle}</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">{t.khataDesc}</p>
                  </div>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                    <Plus className="mr-2 h-4 w-4" /> {t.newCust}
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-8">
                  <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-center shadow-sm dark:shadow-none">
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-1">{t.totOut}</p>
                    <p className="text-3xl font-bold text-rose-600 dark:text-rose-400">₹6,070</p>
                  </Card>
                  <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-center shadow-sm dark:shadow-none">
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-1">{t.activeAcc}</p>
                    <p className="text-3xl font-bold text-zinc-900 dark:text-white">24</p>
                  </Card>
                  <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-center shadow-sm dark:shadow-none">
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-1">{t.recThisWeek}</p>
                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">₹2,150</p>
                  </Card>
                </div>

                <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
                  <Table>
                    <TableHeader className="bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                      <TableRow className="border-zinc-200 dark:border-zinc-800">
                        <TableHead className="text-zinc-500 dark:text-zinc-400">Customer Name</TableHead>
                        <TableHead className="text-zinc-500 dark:text-zinc-400">Phone</TableHead>
                        <TableHead className="text-zinc-500 dark:text-zinc-400">Last Activity</TableHead>
                        <TableHead className="text-zinc-500 dark:text-zinc-400">Status</TableHead>
                        <TableHead className="text-right text-zinc-500 dark:text-zinc-400">Balance Due</TableHead>
                        <TableHead className="text-right text-zinc-500 dark:text-zinc-400">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {khataList.map((customer) => (
                        <TableRow key={customer.id} className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                          <TableCell className="font-medium text-zinc-900 dark:text-white">{customer.name}</TableCell>
                          <TableCell className="text-zinc-600 dark:text-zinc-300">{customer.phone}</TableCell>
                          <TableCell className="text-zinc-500 dark:text-zinc-400 text-sm">{customer.lastActive}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={customer.status === 'Overdue' ? 'text-rose-600 dark:text-rose-400 border-rose-500/20 bg-rose-50 dark:bg-rose-500/10' : 'text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-50 dark:bg-amber-500/10'}>
                              {customer.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-rose-600 dark:text-rose-400 font-bold">{customer.balance}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" className="border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white">Settle Due</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            )}

            {/* VIEW: SALES HISTORY */}
            {activeTab === "sales" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-2xl font-semibold text-zinc-900 dark:text-white">{t.recSales}</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">{t.recSalesDesc}</p>
                  </div>
                  <Button className="bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                    <Receipt className="mr-2 h-4 w-4" /> {t.recSaleBtn}
                  </Button>
                </div>

                <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
                  <Table>
                    <TableHeader className="bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                      <TableRow className="border-zinc-200 dark:border-zinc-800">
                        <TableHead className="w-[120px] text-zinc-500 dark:text-zinc-400">Invoice</TableHead>
                        <TableHead className="text-zinc-500 dark:text-zinc-400">Items Sold</TableHead>
                        <TableHead className="text-zinc-500 dark:text-zinc-400">Payment Type</TableHead>
                        <TableHead className="text-zinc-500 dark:text-zinc-400">Time</TableHead>
                        <TableHead className="text-right text-zinc-500 dark:text-zinc-400">Total Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesList.map((sale) => (
                        <TableRow key={sale.id} className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                          <TableCell className="font-medium text-zinc-900 dark:text-zinc-300">{sale.id}</TableCell>
                          <TableCell className="text-zinc-700 dark:text-zinc-200">{sale.items}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              sale.type.includes('Khata') ? 'text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-50 dark:bg-amber-500/10' :
                                sale.type === 'Cash' ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10' :
                                  'text-indigo-600 dark:text-indigo-400 border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10'
                            }>
                              {sale.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-zinc-500 dark:text-zinc-400 text-sm">{sale.time}</TableCell>
                          <TableCell className="text-right text-zinc-900 dark:text-white font-bold">{sale.total}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            )}

            {/* VIEW: FALLBACK FOR OTHER TABS */}
            {activeTab !== "dashboard" && activeTab !== "inventory" && activeTab !== "khata" && activeTab !== "sales" && (
              <div className="flex flex-col items-center justify-center h-96 text-zinc-400 dark:text-zinc-500 animate-in fade-in duration-500">
                <Package size={48} className="mb-4 opacity-20" />
                <p className="text-lg text-zinc-600 dark:text-zinc-400">The <strong className="text-zinc-900 dark:text-white">{getPageTitle()}</strong> {t.underDev}</p>
                <p className="text-sm">{t.checkBack}</p>
              </div>
            )}

          </ScrollArea>
        </main>

        {/* ================= FLOATING AI AGENT (FAB & POPUP) ================= */}

        {/* 1. The Popup Window */}
        {isAgentOpen && (
          <Card className="fixed bottom-24 right-8 w-[400px] h-[600px] bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200">
            {/* Header */}
            <div className="h-16 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 px-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="bg-indigo-50 dark:bg-indigo-500/20 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
                  <Bot size={20} />
                </div>
                <div>
                  <h2 className="text-md font-semibold text-zinc-900 dark:text-white leading-tight">Bazaar AI Agent</h2>
                  <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 text-[10px] gap-1.5 px-2 py-0 h-5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    Listening in Hinglish & Tamil
                  </Badge>
                </div>
              </div>
              <button onClick={() => setIsAgentOpen(false)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-2">
                <X size={20} />
              </button>
            </div>

            {/* Chat History */}
            <ScrollArea className="flex-1 p-4 bg-zinc-50/50 dark:bg-zinc-950/50">
              <div className="space-y-5 pb-4">
                {messages.map((msg) => (
                  msg.role === "user" ? (
                    <UserMessage key={msg.id} message={msg.text} language={msg.language} />
                  ) : (
                    <AgentMessage
                      key={msg.id}
                      message={msg.text}
                      type={msg.role === "system" ? "system" : "action"}
                      action={msg.action}
                    />
                  )
                ))}
                {isTyping && (
                  <div className="flex items-center gap-2 text-zinc-500 text-sm p-2 animate-pulse">
                    <Bot size={16} /> AI is thinking...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl flex items-end p-2 transition-all focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                <Button variant="ghost" size="icon" className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg h-10 w-10 shrink-0">
                  <Mic size={20} />
                </Button>
                <Textarea
                  className="flex-1 bg-transparent border-0 text-zinc-900 dark:text-white p-2 min-h-[40px] max-h-[120px] resize-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                  placeholder="Speak or type command..."
                  rows={1}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isTyping || !inputText.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg h-10 w-10 shrink-0 p-0 disabled:opacity-50"
                >
                  <Send size={18} />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* 2. The Floating Action Button (FAB) */}
        <button
          onClick={() => setIsAgentOpen(!isAgentOpen)}
          className={`fixed bottom-8 right-8 h-14 w-14 rounded-full flex items-center justify-center shadow-indigo-500/20 shadow-2xl transition-all duration-300 z-50 border-2 ${isAgentOpen ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-300 scale-90' : 'bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 border-indigo-400 text-white hover:scale-105'}`}
        >
          {isAgentOpen ? <X size={24} /> : <Bot size={28} />}
        </button>

      </div>
    </div>
  )
}

// --- HELPER COMPONENTS ---

function NavItem({ icon, label, active, alert, onClick, isCollapsed }: any) {
  return (
    <button
      onClick={onClick}
      title={isCollapsed ? label : undefined}
      className={`relative w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2.5 rounded-lg mb-1 transition-colors ${active ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-white'}`}
    >
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
        {icon}
        {!isCollapsed && <span className="font-medium text-sm">{label}</span>}
      </div>
      {!isCollapsed && alert && <div className="w-2 h-2 rounded-full bg-rose-500"></div>}
      {isCollapsed && alert && <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 border border-white dark:border-zinc-900"></div>}
    </button>
  )
}

function SapCard({ title, subtitle, icon, alert, highlight, onClick }: any) {
  return (
    <Card onClick={onClick} className={`relative group h-36 flex flex-col justify-between transition-all duration-300 bg-white dark:bg-zinc-800/40 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-700/50 hover:border-zinc-300 dark:hover:border-zinc-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-200 dark:hover:shadow-black/40 ${onClick ? 'cursor-pointer' : ''} ${highlight ? 'border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'shadow-sm dark:shadow-none'}`}>
      {alert && <div className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full -mt-1 -mr-1 shadow-[0_0_10px_rgba(244,63,94,0.5)] z-10"></div>}

      <CardHeader className="p-5 pb-0">
        <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-200 group-hover:text-black dark:group-hover:text-white transition-colors">{title}</CardTitle>
        {subtitle && <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{subtitle}</CardDescription>}
      </CardHeader>

      <CardContent className="p-5 pt-0 flex justify-start items-end flex-1">
        <div className={`${highlight ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 dark:text-zinc-500'} group-hover:scale-110 transition-transform origin-bottom-left`}>
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}

function AgentMessage({ message, type, action }: any) {
  return (
    <div className="flex gap-3">
      <Avatar className="w-8 h-8 mt-1 border border-zinc-200 dark:border-zinc-700/50">
        <AvatarFallback className={`text-xs ${type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'}`}>
          {type === 'success' ? <CheckCircle2 size={16} /> : <Bot size={16} />}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <div className="bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/50 p-3 rounded-2xl rounded-tl-none text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed shadow-sm">
          {message}
          {action && (
            <Card className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 shadow-none">
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-1">{action.action}</p>
              <div className="flex justify-between font-medium text-zinc-900 dark:text-white">
                <span>{action.item}</span>
                <span className="text-emerald-600 dark:text-emerald-400">{action.qty}</span>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs">Confirm</Button>
                <Button size="sm" variant="outline" className="w-full border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 h-8 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800">Cancel</Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function UserMessage({ message, language }: any) {
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2 items-center text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-500 mb-0.5">
        <Mic size={10} /> {language}
      </div>
      <div className="flex gap-3 flex-row-reverse">
        <Avatar className="w-8 h-8 mt-1 border border-zinc-200 dark:border-zinc-700/50">
          <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs">
            <User size={16} />
          </AvatarFallback>
        </Avatar>
        <div className="bg-indigo-600 shadow-md shadow-indigo-600/20 text-white p-3 rounded-2xl rounded-tr-none text-sm">
          {message}
        </div>
      </div>
    </div>
  )
}