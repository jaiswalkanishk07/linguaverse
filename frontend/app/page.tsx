"use client";

import { useState, useEffect, useRef, useCallback } from "react"
import { apiFetch, SHOP_ID } from "@/lib/api"
import { sarvamSTT, sarvamTTS, mapLanguageToSarvam } from "@/lib/sarvam"
import {
  LayoutDashboard, Package, Wallet, Truck, Users, FileText,
  Settings, Mic, Send, AlertTriangle, Plus, Search,
  Bot, User, CheckCircle2, X, BarChart3, Receipt, FileSpreadsheet,
  BookOpen, Bell, Globe, LogOut, PanelLeftClose, PanelLeftOpen,
  Lock, ArrowRight, WifiOff, Sun, Moon, Zap, ShieldCheck, Languages, Eye, EyeOff
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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

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

interface AgentApiResponse {
  action: string;
  sku: string;
  quantity: number;
  amount: number;
  customer_name: string;
  confidence: number;
  response_text: string;
  detected_language: string;
}

// Map LLM detected_language ("hi","en","ta") to Sarvam language code
function detectedLangToSarvam(lang: string): "hi-IN" | "ta-IN" | "en-IN" {
  if (lang === "ta") return "ta-IN";
  if (lang === "hi") return "hi-IN";
  return "en-IN";
}

interface BackendProduct {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  category: string;
  low_stock_threshold: number;
}

interface BackendSale {
  id: number;
  product_name: string;
  sku: string;
  qty_sold: number;
  amount: number;
  created_by: string;
  created_at: string;
}

interface BackendKhata {
  id: number;
  customer_name: string;
  phone: string;
  outstanding_balance: number;
  days_overdue: number;
  last_payment_date: string;
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
  const [showLanding, setShowLanding] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showPassword, setShowPassword] = useState(false);

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

  // --- LOADING & ERROR STATES ---
  const [loadingData, setLoadingData] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // --- VOICE RECORDING STATES ---
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // --- LIVE DATA STATES ---
  const [stats, setStats] = useState({
    todaySales: "₹0", salesTrend: "", totalItems: 0,
    lowStock: 0, pendingOrders: 0, monthlyRev: "₹0"
  });

  const [inventoryList, setInventoryList] = useState<
    { id: number; sku: string; name: string; stock: number; price: string; status: string }[]
  >([]);

  const [khataList, setKhataList] = useState<
    { id: number; name: string; phone: string; balance: string; lastActive: string; status: string }[]
  >([]);

  const [salesList, setSalesList] = useState<
    { id: string; items: string; total: string; type: string; time: string }[]
  >([]);

  const [suppliersList, setSuppliersList] = useState<
    { id: string; name: string; contact: string; products: string; dues: string; status: string }[]
  >([]);

  const [ordersList, setOrdersList] = useState<
    { id: string; supplier: string; items: string; total: string; status: string; date: string }[]
  >([]);

  const [reportsData, setReportsData] = useState({
    pnl: "₹0", revenue: "₹0", gst: "₹0",
    topProducts: [] as { name: string; sold: number; rev: string }[],
    lowStockAlerts: [] as { name: string; current: number; threshold: number }[],
    salesTrend: [] as { date: string; revenue: number }[]
  });

  // Store the last agent response for confirmation flow
  const [pendingAction, setPendingAction] = useState<AgentApiResponse | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1, role: "system",
      text: "🙏 Namaste! I'm your Linguaverse AI assistant. Aap Hindi, English ya Tamil mein baat kar sakte hain — voice ya text dono chalega! Try: \"stock dikhao\" or \"aaj ka report\"",
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

  // --- LIVE DATA FETCHING ---
  const fetchInventory = useCallback(async () => {
    try {
      const data: any = await apiFetch(`/inventory/?shop_id=${SHOP_ID}&limit=50`);
      setInventoryList(data.products.map((p: BackendProduct) => ({
        id: p.id, sku: p.sku, name: p.name, stock: p.quantity,
        price: `₹${p.unit_price}`,
        status: p.quantity <= (p.low_stock_threshold * 0.5) ? "Low Stock" : p.quantity <= p.low_stock_threshold ? "Warning" : "Healthy"
      })));
    } catch (err: any) {
      setApiError(err.message || "Failed to load inventory");
    }
  }, []);

  const fetchSales = useCallback(async () => {
    try {
      const data: any = await apiFetch(`/sales/?shop_id=${SHOP_ID}&limit=20`);
      setSalesList(data.sales.map((s: BackendSale) => {
        const date = new Date(s.created_at);
        const now = new Date();
        const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
        const timeStr = diffMins < 60 ? `${diffMins} mins ago` : diffMins < 1440 ? `${Math.floor(diffMins / 60)} hours ago` : `${Math.floor(diffMins / 1440)} days ago`;
        return {
          id: `INV-${s.id}`, items: `${s.product_name} (x${s.qty_sold})`,
          total: `₹${s.amount.toLocaleString()}`,
          type: s.created_by === "agent" ? "AI Agent" : s.created_by === "admin" ? "Manual" : "Cash",
          time: timeStr
        };
      }));
    } catch (err: any) {
      setApiError(err.message || "Failed to load sales");
    }
  }, []);

  const fetchKhata = useCallback(async () => {
    try {
      const data: any = await apiFetch(`/khata/?shop_id=${SHOP_ID}&limit=50`);
      setKhataList(data.accounts.map((k: BackendKhata) => ({
        id: k.id, name: k.customer_name, phone: k.phone || "N/A",
        balance: `₹${k.outstanding_balance.toLocaleString()}`,
        lastActive: k.days_overdue === 0 ? "Recent" : `${k.days_overdue} days overdue`,
        status: k.days_overdue > 30 ? "Overdue" : "Pending"
      })));
    } catch (err: any) {
      setApiError(err.message || "Failed to load khata");
    }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      const data: any = await apiFetch(`/suppliers/?shop_id=${SHOP_ID}`);
      setSuppliersList(data.suppliers.map((s: any) => ({
        id: `SUP-${s.id}`, name: s.name, contact: s.contact_info || "N/A",
        products: s.category || "General", dues: `₹${(s.pending_amount || 0).toLocaleString()}`,
        status: (s.pending_amount || 0) > 0 ? "Pending Payment" : "Active"
      })));
    } catch { /* Suppliers are non-critical */ }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const data: any = await apiFetch(`/suppliers/orders?shop_id=${SHOP_ID}`);
      setOrdersList(data.orders.map((o: any) => ({
        id: `PO-${o.id}`, supplier: o.supplier_name || "Unknown",
        items: `${o.notes || "Items"} (x${o.quantity || 1})`,
        total: `₹${(o.total_cost || 0).toLocaleString()}`,
        status: o.status || "Pending", date: new Date(o.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      })));
    } catch { /* Orders are non-critical */ }
  }, []);

  const fetchReports = useCallback(async () => {
    try {
      const [reportData, analyticsData]: [any, any] = await Promise.all([
        apiFetch(`/reports/summary?shop_id=${SHOP_ID}`),
        apiFetch(`/reports/analytics?shop_id=${SHOP_ID}`)
      ]);
      const pnl = reportData.profit_and_loss;
      const top = reportData.top_products || [];
      const gstData = reportData.gst_summary;
      const lowAlerts = analyticsData.low_stock_alerts || [];
      setReportsData({
        pnl: `₹${pnl.net_profit.toLocaleString()}`,
        revenue: `₹${pnl.total_revenue.toLocaleString()}`,
        gst: `₹${(gstData?.total_gst || 0).toLocaleString()}`,
        topProducts: top.map((p: any) => ({ name: p.name, sold: p.quantity_sold, rev: `₹${p.revenue.toLocaleString()}` })),
        lowStockAlerts: lowAlerts.map((a: any) => ({ name: a.name, current: a.current_quantity, threshold: a.low_stock_threshold })),
        salesTrend: analyticsData.sales_trend || []
      });
      setStats(prev => ({
        ...prev,
        todaySales: `₹${pnl.total_revenue.toLocaleString()}`,
        salesTrend: pnl.profit_margin_percent > 0 ? `+${pnl.profit_margin_percent}%` : `${pnl.profit_margin_percent}%`,
        lowStock: lowAlerts.length,
        monthlyRev: `₹${(pnl.total_revenue / 1000).toFixed(1)}K`
      }));
    } catch { /* Reports non-critical */ }
  }, []);

  // Fetch data when tab changes
  useEffect(() => {
    if (!isAuthenticated) return;
    setApiError(null);
    setLoadingData(true);
    const load = async () => {
      if (activeTab === "dashboard") { await fetchInventory(); await fetchReports(); }
      else if (activeTab === "inventory") await fetchInventory();
      else if (activeTab === "sales") await fetchSales();
      else if (activeTab === "khata") await fetchKhata();
      else if (activeTab === "suppliers") await fetchSuppliers();
      else if (activeTab === "orders") await fetchOrders();
      else if (activeTab === "reports") await fetchReports();
      setLoadingData(false);
    };
    load();
  }, [activeTab, isAuthenticated, fetchInventory, fetchSales, fetchKhata, fetchSuppliers, fetchOrders, fetchReports]);

  // Update totalItems when inventory loads
  useEffect(() => {
    if (inventoryList.length > 0) setStats(prev => ({ ...prev, totalItems: inventoryList.length }));
  }, [inventoryList]);

  const cycleLanguage = () => {
    if (language === "en") setLanguage("hi-essential");
    else if (language === "hi-essential") setLanguage("hi-full");
    else if (language === "hi-full") setLanguage("ta");
    else setLanguage("en");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // --- AI AGENT: ACTION HANDLING ---
  const WRITE_ACTIONS = ["update_stock", "add_product", "record_sale", "khata_payment"];
  const READ_ACTIONS = ["get_stock", "get_khata", "get_report"];

  const handleReadAction = async (response: AgentApiResponse) => {
    const lang = response.detected_language || "en";
    const ttsLang = detectedLangToSarvam(lang);
    try {
      let resultText = response.response_text;
      if (response.action === "get_stock") {
        const data: any = await apiFetch(`/inventory/?shop_id=${SHOP_ID}&limit=50`);
        const products = data.products;
        if (response.sku) {
          const match = products.find((p: any) => p.sku === response.sku);
          if (match) {
            const lowLabel = lang === "hi" ? "⚠️ स्टॉक कम है!" : lang === "ta" ? "⚠️ கையிருப்பு குறைவு!" : "⚠️ Low stock!";
            const okLabel = lang === "hi" ? "✅ स्टॉक ठीक है" : lang === "ta" ? "✅ கையிருப்பு நல்லது" : "✅ Stock healthy";
            const stockWord = lang === "hi" ? "स्टॉक" : lang === "ta" ? "கையிருப்பு" : "Stock";
            const priceWord = lang === "hi" ? "कीमत" : lang === "ta" ? "விலை" : "Price";
            resultText = `📦 ${match.name} (${match.sku})\n${stockWord}: ${match.quantity}\n${priceWord}: ₹${match.unit_price}\n${match.quantity <= match.low_stock_threshold ? lowLabel : okLabel}`;
          } else {
            resultText = response.response_text || (lang === "hi" ? "उत्पाद नहीं मिला।" : lang === "ta" ? "பொருள் கிடைக்கவில்லை." : "Product not found.");
          }
        } else {
          const header = lang === "hi" ? "📦 वर्तमान इन्वेंटरी:" : lang === "ta" ? "📦 தற்போதைய கையிருப்பு:" : "📦 Current Inventory:";
          const summary = products.slice(0, 5).map((p: any) => `• ${p.name}: ${p.quantity} ${p.quantity <= p.low_stock_threshold ? "⚠️" : "✅"}`).join("\n");
          const moreText = products.length > 5 ? (lang === "hi" ? `\n...और ${products.length - 5} और` : lang === "ta" ? `\n...மேலும் ${products.length - 5}` : `\n...and ${products.length - 5} more`) : "";
          resultText = `${header}\n${summary}${moreText}`;
        }
      } else if (response.action === "get_khata") {
        const data: any = await apiFetch(`/khata/?shop_id=${SHOP_ID}&limit=50`);
        if (response.customer_name) {
          const match = data.accounts.find((k: any) => k.customer_name.toLowerCase().includes(response.customer_name.toLowerCase()));
          if (match) {
            const outLabel = lang === "hi" ? "बकाया" : lang === "ta" ? "நிலுவை" : "Outstanding";
            const overdueLabel = match.days_overdue > 0
              ? (lang === "hi" ? `⚠️ ${match.days_overdue} दिन से बकाया` : lang === "ta" ? `⚠️ ${match.days_overdue} நாட்கள் தாமதம்` : `⚠️ ${match.days_overdue} days overdue`)
              : (lang === "hi" ? "✅ समय पर" : lang === "ta" ? "✅ சரியான நேரத்தில்" : "✅ On time");
            resultText = `📒 ${match.customer_name}\n${outLabel}: ₹${match.outstanding_balance.toLocaleString()}\n${overdueLabel}`;
          } else {
            resultText = response.response_text || (lang === "hi" ? "ग्राहक नहीं मिला।" : lang === "ta" ? "வாடிக்கையாளர் கிடைக்கவில்லை." : "Customer not found.");
          }
        } else {
          const header = lang === "hi" ? "📒 बकाया खाता:" : lang === "ta" ? "📒 நிலுவை கணக்கு:" : "📒 Pending Khata:";
          const summary = data.accounts.slice(0, 5).map((k: any) => `• ${k.customer_name}: ₹${k.outstanding_balance.toLocaleString()} ${k.days_overdue > 30 ? "🔴" : "🟡"}`).join("\n");
          resultText = `${header}\n${summary}`;
        }
      } else if (response.action === "get_report") {
        const rpt: any = await apiFetch(`/reports/summary?shop_id=${SHOP_ID}`);
        const pnl = rpt.profit_and_loss;
        if (lang === "hi") {
          resultText = `📊 मासिक रिपोर्ट (${rpt.period}):\nराजस्व: ₹${pnl.total_revenue.toLocaleString()}\nखर्च: ₹${pnl.total_expenses.toLocaleString()}\nशुद्ध लाभ: ₹${pnl.net_profit.toLocaleString()} (${pnl.profit_margin_percent}%)`;
        } else if (lang === "ta") {
          resultText = `📊 மாத அறிக்கை (${rpt.period}):\nவருவாய்: ₹${pnl.total_revenue.toLocaleString()}\nசெலவுகள்: ₹${pnl.total_expenses.toLocaleString()}\nநிகர லாபம்: ₹${pnl.net_profit.toLocaleString()} (${pnl.profit_margin_percent}%)`;
        } else {
          resultText = `📊 Monthly Report (${rpt.period}):\nRevenue: ₹${pnl.total_revenue.toLocaleString()}\nExpenses: ₹${pnl.total_expenses.toLocaleString()}\nNet Profit: ₹${pnl.net_profit.toLocaleString()} (${pnl.profit_margin_percent}%)`;
        }
      }
      setMessages(prev => [...prev, { id: Date.now() + 1, role: "agent", text: resultText, language: null, action: null }]);
      // TTS: speak read action results in the detected language
      try { sarvamTTS(resultText, ttsLang); } catch { }
    } catch (err: any) {
      const errText = lang === "hi" ? `⚠️ डेटा प्राप्त नहीं हो सका: ${err.message}` : lang === "ta" ? `⚠️ தரவைப் பெற முடியவில்லை: ${err.message}` : `⚠️ Could not fetch data: ${err.message}`;
      setMessages(prev => [...prev, { id: Date.now() + 1, role: "agent", text: errText, language: null, action: null }]);
    }
  };

  const handleSendMessage = async (overrideText?: string) => {
    const userText = (overrideText || inputText).trim();
    if (!userText || isTyping) return;

    const newUserMsg: Message = { id: Date.now(), role: "user", text: userText, language: "Hinglish", action: null };

    setMessages(prev => [...prev, newUserMsg]);
    setInputText("");
    setIsTyping(true);

    try {
      const response = await apiFetch<AgentApiResponse>("/agent/parse", {
        method: "POST",
        body: JSON.stringify({ shop_id: SHOP_ID, message: userText }),
      });

      const detLang = response.detected_language || "en";
      const ttsLang = detectedLangToSarvam(detLang);

      if (READ_ACTIONS.includes(response.action)) {
        const checkText = detLang === "hi" ? "🔍 देख रहे हैं..." : detLang === "ta" ? "🔍 சரிபார்க்கிறோம்..." : "🔍 Checking...";
        setMessages(prev => [...prev, { id: Date.now() + 1, role: "agent", text: checkText, language: null, action: null }]);
        setIsTyping(false);
        await handleReadAction(response);
        return;
      }

      if (WRITE_ACTIONS.includes(response.action) && response.confidence >= 0.7) {
        setPendingAction(response);
        const confWarning = response.confidence < 0.85 ? (detLang === "hi" ? " ⚠️ मध्यम विश्वास" : detLang === "ta" ? " ⚠️ நடுத்தர நம்பகத்தன்மை" : " ⚠️ Medium confidence") : "";
        const agentMsg: Message = {
          id: Date.now() + 1, role: "agent",
          text: response.response_text + confWarning,
          language: null,
          action: {
            item: response.sku || response.customer_name || "N/A",
            qty: response.action === "khata_payment" ? `₹${response.amount}` : String(response.quantity),
            action: response.action.toUpperCase().replace(/_/g, " ")
          },
        };
        setMessages(prev => [...prev, agentMsg]);
        try { sarvamTTS(response.response_text, ttsLang); } catch { }
      } else {
        const fallbackText = response.response_text || (detLang === "hi" ? "समझ नहीं आया। दोबारा बोलें?" : detLang === "ta" ? "புரியவில்லை. மீண்டும் சொல்லுங்கள்?" : "I didn't understand. Could you try again?");
        setMessages(prev => [...prev, {
          id: Date.now() + 1, role: "agent",
          text: fallbackText,
          language: null, action: null,
        }]);
        try { sarvamTTS(fallbackText, ttsLang); } catch { }
      }
    } catch (err: any) {
      const errMsg = err.message || "";
      let displayMsg = "❌ AI unavailable. Try again.";
      if (errMsg.includes("timed out")) displayMsg = "⏳ Taking too long. Check connection.";
      else if (errMsg.includes("429")) displayMsg = "⚠️ API rate limit reached. Wait a minute and try again.";
      else if (errMsg.includes("API Error")) displayMsg = `⚠️ ${errMsg}`;
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: "agent",
        text: displayMsg,
        language: null, action: null,
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    setIsTyping(true);
    try {
      let result: any;
      if (pendingAction.action === "update_stock") {
        const qty = pendingAction.quantity;
        result = await apiFetch("/inventory/update", {
          method: "POST",
          body: JSON.stringify({ shop_id: SHOP_ID, sku: pendingAction.sku, quantity: Math.abs(qty), update_type: qty < 0 ? "outgoing" : "incoming" }),
        });
      } else if (pendingAction.action === "record_sale") {
        result = await apiFetch("/sales/record", {
          method: "POST",
          body: JSON.stringify({ shop_id: SHOP_ID, sku: pendingAction.sku, qty_sold: pendingAction.quantity, amount: pendingAction.amount, created_by: "agent" }),
        });
      } else if (pendingAction.action === "add_product") {
        const productName = pendingAction.customer_name || pendingAction.sku;
        const sku = pendingAction.sku || productName.toUpperCase().replace(/\s+/g, "-").slice(0, 12);
        result = await apiFetch("/inventory/create", {
          method: "POST",
          body: JSON.stringify({ shop_id: SHOP_ID, name: productName, sku: sku, unit_price: pendingAction.amount || 0, category: "General", quantity: pendingAction.quantity || 0 }),
        });
      } else if (pendingAction.action === "khata_payment") {
        result = await apiFetch("/khata/payment", {
          method: "POST",
          body: JSON.stringify({ shop_id: SHOP_ID, customer_name: pendingAction.customer_name, amount: pendingAction.amount }),
        });
      }
      const pLang = pendingAction.detected_language || "en";
      const pTts = detectedLangToSarvam(pLang);
      let detail = "";
      if (result?.data?.new_quantity != null) {
        detail = pLang === "hi" ? ` नया स्टॉक: ${result.data.new_quantity}` : pLang === "ta" ? ` புதிய கையிருப்பு: ${result.data.new_quantity}` : ` New stock: ${result.data.new_quantity}`;
      } else if (result?.data?.remaining_stock != null) {
        detail = pLang === "hi" ? ` शेष: ${result.data.remaining_stock}` : pLang === "ta" ? ` மீதமுள்ளது: ${result.data.remaining_stock}` : ` Remaining: ${result.data.remaining_stock}`;
      } else if (result?.data?.new_balance != null) {
        detail = pLang === "hi" ? ` नया बैलेंस: ₹${result.data.new_balance}` : pLang === "ta" ? ` புதிய இருப்பு: ₹${result.data.new_balance}` : ` New balance: ₹${result.data.new_balance}`;
      }
      const confirmText = pLang === "hi" ? `कार्रवाई सफल!${detail}` : pLang === "ta" ? `செயல் உறுதிப்படுத்தப்பட்டது!${detail}` : `Action confirmed!${detail}`;
      setMessages(prev => [...prev, { id: Date.now(), role: "agent", text: `✅ ${confirmText}`, language: null, action: null }]);
      try { sarvamTTS(confirmText, pTts); } catch { }
      fetchInventory(); fetchSales(); fetchReports(); fetchKhata();
    } catch (err: any) {
      const fLang = pendingAction?.detected_language || "en";
      const failText = fLang === "hi" ? `❌ विफल: ${err.message}` : fLang === "ta" ? `❌ தோல்வி: ${err.message}` : `❌ Failed: ${err.message}`;
      setMessages(prev => [...prev, { id: Date.now(), role: "agent", text: failText, language: null, action: null }]);
    } finally {
      setIsTyping(false);
      setPendingAction(null);
    }
  };

  const handleCancelAction = () => {
    const cLang = pendingAction?.detected_language || "en";
    const cancelText = cLang === "hi" ? "❌ रद्द। और कुछ मदद चाहिए?" : cLang === "ta" ? "❌ ரத்து செய்யப்பட்டது. வேறு உதவி வேண்டுமா?" : "❌ Cancelled. Need anything else?";
    setPendingAction(null);
    setMessages(prev => [...prev, { id: Date.now(), role: "agent", text: cancelText, language: null, action: null }]);
  };

  // --- VOICE RECORDING ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch {
      setMessages(prev => [...prev, { id: Date.now(), role: "agent", text: "🎤 Mic permission denied. Please allow microphone access.", language: null, action: null }]);
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
    setIsRecording(false);
    setIsProcessingAudio(true);

    const recorder = mediaRecorderRef.current;
    return new Promise<void>((resolve) => {
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        recorder.stream.getTracks().forEach(track => track.stop());
        try {
          const transcript = await sarvamSTT(audioBlob, mapLanguageToSarvam(language));
          if (transcript.trim()) {
            // Auto-send the voice transcript directly
            handleSendMessage(transcript.trim());
          } else {
            setMessages(prev => [...prev, { id: Date.now(), role: "agent", text: "🎤 Couldn't hear clearly. Please try again or type your command.", language: null, action: null }]);
          }
        } catch (err: any) {
          console.error("Sarvam STT Error:", err);
          setMessages(prev => [...prev, { id: Date.now(), role: "agent", text: `🎤 Voice error: ${err.message || 'Unknown error'}. Please type your command.`, language: null, action: null }]);
        } finally {
          setIsProcessingAudio(false);
        }
        resolve();
      };
      recorder.stop();
    });
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
  // VIEW: LANDING HOME PAGE
  // ==========================================
  if (showLanding) {
    return (
      <div className={theme === 'dark' ? 'dark' : ''}>
        <div
          className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans relative overflow-hidden transition-colors duration-500"
          onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
        >
          {/* Ambient Glow */}
          <div
            className="fixed w-[700px] h-[700px] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none transition-all duration-700 ease-out z-0"
            style={{
              left: mousePos.x === 0 && mousePos.y === 0 ? '50%' : `${mousePos.x}px`,
              top: mousePos.x === 0 && mousePos.y === 0 ? '40%' : `${mousePos.y}px`,
              transform: 'translate(-50%, -50%)'
            }}
          />
          <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-violet-500/5 dark:bg-violet-500/10 rounded-full blur-[100px] pointer-events-none z-0" />

          {/* NAV BAR */}
          <nav className="relative z-20 flex items-center justify-between px-8 md:px-16 py-6">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
                Bazaar<span className="text-indigo-600 dark:text-indigo-500">OS</span>
              </h1>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium tracking-wide mt-0.5">Be your own BOS</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:scale-110 transition-transform"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <Button
                onClick={() => setShowLanding(false)}
                className="bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 text-white px-6 py-2 text-sm font-semibold group"
              >
                Login <ArrowRight className="ml-1.5 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </nav>

          {/* HERO SECTION */}
          <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-16 pb-20 md:pt-24 md:pb-28">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 dark:bg-indigo-400/10 border border-indigo-500/20 mb-8">
              <Zap size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">AI-Powered ERP for Indian MSMEs</span>
            </div>

            <h2 className="text-5xl md:text-7xl font-extrabold text-zinc-900 dark:text-white leading-[1.1] tracking-tight max-w-4xl">
              Run your business in{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-violet-500 to-purple-500 bg-clip-text text-transparent">any language</span>
            </h2>

            <p className="mt-6 text-lg md:text-xl text-zinc-500 dark:text-zinc-400 max-w-2xl leading-relaxed">
              The first multilingual ERP that understands Hindi, English, Tamil &amp; more.
              Manage inventory, sales, and credit — all through voice or text.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => setShowLanding(false)}
                className="bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 text-white px-8 py-6 text-md font-semibold group shadow-lg shadow-indigo-500/25"
              >
                Get Started <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                variant="outline"
                className="border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 px-8 py-6 text-md font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => setShowLanding(false)}
              >
                Watch Demo
              </Button>
            </div>
          </section>

          {/* FEATURE CARDS */}
          <section className="relative z-10 px-8 md:px-16 pb-24">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Card 1 */}
              <div className="group p-8 rounded-2xl bg-white/70 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 backdrop-blur-sm hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-5 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                  <Languages className="text-indigo-600 dark:text-indigo-400 w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Multilingual AI Agent</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Speak in Hindi, Hinglish, Tamil or English. Our AI understands your language and responds naturally.
                </p>
              </div>
              {/* Card 2 */}
              <div className="group p-8 rounded-2xl bg-white/70 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 backdrop-blur-sm hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-5 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                  <Package className="text-emerald-600 dark:text-emerald-400 w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Real-time Inventory</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Track stock levels, get low-stock alerts, and manage your entire product catalog in real time.
                </p>
              </div>
              {/* Card 3 */}
              <div className="group p-8 rounded-2xl bg-white/70 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 backdrop-blur-sm hover:border-violet-500/30 hover:shadow-xl hover:shadow-violet-500/5 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-5 border border-violet-500/20 group-hover:scale-110 transition-transform">
                  <Mic className="text-violet-600 dark:text-violet-400 w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Voice-Powered</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Just speak your commands. Record sales, update stock, and check reports — all hands-free.
                </p>
              </div>
            </div>
          </section>

          {/* TRUST BAR */}
          <section className="relative z-10 border-t border-zinc-200 dark:border-zinc-800/60 py-10">
            <div className="flex flex-wrap items-center justify-center gap-8 text-zinc-400 dark:text-zinc-500 text-sm">
              <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-500" /> End-to-end Encrypted</div>
              <div className="flex items-center gap-2"><Globe size={16} className="text-indigo-500" /> 4+ Languages Supported</div>
              <div className="flex items-center gap-2"><Zap size={16} className="text-amber-500" /> Powered by Groq AI</div>
            </div>
          </section>
        </div>
      </div>
    )
  }

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
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus-visible:ring-indigo-500 pr-10" defaultValue="password123" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
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

            {/* Loading Spinner */}
            {loadingData && (
              <div className="flex items-center gap-2 mb-4 text-sm text-indigo-600 dark:text-indigo-400 animate-pulse">
                <div className="w-4 h-4 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin" />
                Loading data...
              </div>
            )}

            {/* Error Banner */}
            {apiError && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-lg flex items-center justify-between">
                <span className="text-sm text-rose-600 dark:text-rose-400">⚠️ {apiError}</span>
                <button onClick={() => setApiError(null)} className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-300">
                  <X size={14} />
                </button>
              </div>
            )}
            {activeTab === "dashboard" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-10">
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-4">{t.invController}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    <SapCard title={t.manageStock} subtitle={`${stats.totalItems} Items`} icon={<Package />} onClick={() => setActiveTab("inventory")} />
                    <SapCard title={t.lowStock} subtitle={`${stats.lowStock} Items`} icon={<AlertTriangle />} alert />
                    <SapCard title={t.createPo} icon={<Plus />} />
                    <SapCard title={t.supplierLedger} subtitle="Dues: ₹4,200" icon={<Users />} onClick={() => setActiveTab("suppliers")} />
                    <SapCard title={t.stockRecon} icon={<FileSpreadsheet />} onClick={() => setActiveTab("reports")} />
                  </div>
                </div>

                <div className="mb-10">
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-4">{t.salesFinance}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    <SapCard title={t.todaySales} subtitle={`${stats.todaySales} (${stats.salesTrend})`} icon={<Wallet />} highlight onClick={() => setActiveTab("sales")} />
                    <SapCard title={t.manualSale} icon={<Receipt />} onClick={() => setActiveTab("sales")} />
                    <SapCard title={t.monthlyRev} subtitle={stats.monthlyRev} icon={<BarChart3 />} onClick={() => setActiveTab("reports")} />
                    <SapCard title={t.pendingRec} subtitle={`${stats.pendingOrders} Invoices`} icon={<FileText />} onClick={() => setActiveTab("khata")} />
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
                    <DialogContent className="sm:max-w-[480px] bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white">
                      <DialogHeader>
                        <DialogTitle>{t.addItem}</DialogTitle>
                        <DialogDescription className="text-zinc-500 dark:text-zinc-400">
                          Add a new product to your inventory.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="add-name" className="text-right text-zinc-700 dark:text-zinc-300">Name</Label>
                          <Input id="add-name" placeholder="Havells 16A MCB" className="col-span-3 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-700" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="add-sku" className="text-right text-zinc-700 dark:text-zinc-300">SKU</Label>
                          <Input id="add-sku" placeholder="ELE-MCB-16A" className="col-span-3 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-700" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="add-price" className="text-right text-zinc-700 dark:text-zinc-300">Price (₹)</Label>
                          <Input id="add-price" type="number" placeholder="245" className="col-span-3 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-700" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="add-category" className="text-right text-zinc-700 dark:text-zinc-300">Category</Label>
                          <Input id="add-category" placeholder="Electronics" className="col-span-3 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-700" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="add-qty" className="text-right text-zinc-700 dark:text-zinc-300">Stock Qty</Label>
                          <Input id="add-qty" type="number" placeholder="100" className="col-span-3 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-700" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={async () => {
                          const name = (document.getElementById('add-name') as HTMLInputElement)?.value;
                          const sku = (document.getElementById('add-sku') as HTMLInputElement)?.value;
                          const price = parseFloat((document.getElementById('add-price') as HTMLInputElement)?.value || '0');
                          const category = (document.getElementById('add-category') as HTMLInputElement)?.value || 'General';
                          const qty = parseInt((document.getElementById('add-qty') as HTMLInputElement)?.value || '0');
                          if (!name || !sku || price <= 0) { setApiError('Name, SKU, and Price are required.'); return; }
                          try {
                            await apiFetch('/inventory/create', { method: 'POST', body: JSON.stringify({ shop_id: SHOP_ID, name, sku, unit_price: price, category, quantity: qty }) });
                            fetchInventory();
                            setApiError(null);
                          } catch (err: any) { setApiError(err.message); }
                        }} className="bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 text-white">Add Product</Button>
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
                        <TableHead className="text-right text-zinc-500 dark:text-zinc-400">Actions</TableHead>
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
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/10 h-7 px-2 text-xs"
                              onClick={async () => {
                                if (!confirm(`Delete ${item.name}?`)) return;
                                try {
                                  await apiFetch(`/inventory/${item.id}?shop_id=${SHOP_ID}`, { method: 'DELETE' });
                                  fetchInventory();
                                } catch (err: any) { setApiError(err.message); }
                              }}>
                              <X size={14} className="mr-1" /> Delete
                            </Button>
                          </TableCell>
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
                    <p className="text-3xl font-bold text-rose-600 dark:text-rose-400">₹{khataList.reduce((sum, k) => sum + parseInt(k.balance.replace(/[₹,]/g, '') || '0'), 0).toLocaleString()}</p>
                  </Card>
                  <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-center shadow-sm dark:shadow-none">
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-1">{t.activeAcc}</p>
                    <p className="text-3xl font-bold text-zinc-900 dark:text-white">{khataList.length}</p>
                  </Card>
                  <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-center shadow-sm dark:shadow-none">
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-1">{t.recThisWeek}</p>
                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">₹0</p>
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
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" className="border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white">Settle Due</Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[425px] bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white">
                                <DialogHeader>
                                  <DialogTitle>Settle Khata Due</DialogTitle>
                                  <DialogDescription className="text-zinc-500 dark:text-zinc-400">
                                    Record a payment to clear the outstanding balance for {customer.name}.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="flex justify-between items-center bg-rose-50 dark:bg-rose-500/10 p-3 rounded-lg border border-rose-100 dark:border-rose-500/20">
                                    <span className="text-sm font-medium text-rose-600 dark:text-rose-400">Total Outstanding:</span>
                                    <span className="text-lg font-bold text-rose-600 dark:text-rose-400">{customer.balance}</span>
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor={`amount-${customer.id}`} className="text-right text-zinc-700 dark:text-zinc-300">Amount</Label>
                                    <Input id={`amount-${customer.id}`} placeholder="₹0.00" className="col-span-3 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-700" />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor={`mode-${customer.id}`} className="text-right text-zinc-700 dark:text-zinc-300">Mode</Label>
                                    <select id={`mode-${customer.id}`} className="col-span-3 flex h-10 w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                                      <option value="cash">Cash</option>
                                      <option value="upi">UPI / QR Code</option>
                                    </select>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-500 text-white">Record Payment</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
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
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                        <Receipt className="mr-2 h-4 w-4" /> {t.recSaleBtn}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white">
                      <DialogHeader>
                        <DialogTitle>Record Manual Sale</DialogTitle>
                        <DialogDescription className="text-zinc-500 dark:text-zinc-400">
                          Log a new transaction manually.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="sale-item" className="text-right text-zinc-700 dark:text-zinc-300">Item</Label>
                          <select id="sale-item" className="col-span-3 flex h-10 w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                            <option value="">Select Product...</option>
                            {inventoryList.map(item => (
                              <option key={item.sku} value={item.sku}>{item.name} ({item.sku})</option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="sale-qty" className="text-right text-zinc-700 dark:text-zinc-300">Quantity</Label>
                          <Input id="sale-qty" type="number" placeholder="1" className="col-span-3 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-700" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="sale-amount" className="text-right text-zinc-700 dark:text-zinc-300">Amount (₹)</Label>
                          <Input id="sale-amount" type="number" placeholder="0" className="col-span-3 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-700" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={async () => {
                          const sku = (document.getElementById('sale-item') as HTMLSelectElement)?.value;
                          const qty = parseInt((document.getElementById('sale-qty') as HTMLInputElement)?.value || '0');
                          const amount = parseFloat((document.getElementById('sale-amount') as HTMLInputElement)?.value || '0');
                          if (!sku || qty <= 0 || amount <= 0) return;
                          try {
                            await apiFetch('/sales/record', { method: 'POST', body: JSON.stringify({ shop_id: SHOP_ID, sku, qty_sold: qty, amount, created_by: 'admin' }) });
                            fetchSales(); fetchInventory(); fetchReports();
                          } catch (err: any) { setApiError(err.message); }
                        }} className="bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 text-white">Confirm Sale</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
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

            {/* VIEW: SUPPLIERS */}
            {activeTab === "suppliers" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-2xl font-semibold text-zinc-900 dark:text-white">Supplier Directory</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Manage your wholesale partners and pending dues.</p>
                  </div>
                  <Button className="bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                    <Plus className="mr-2 h-4 w-4" /> Add Supplier
                  </Button>
                </div>

                <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
                  <Table>
                    <TableHeader className="bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                      <TableRow className="border-zinc-200 dark:border-zinc-800">
                        <TableHead className="w-[100px] text-zinc-500 dark:text-zinc-400">ID</TableHead>
                        <TableHead className="text-zinc-500 dark:text-zinc-400">Supplier Name</TableHead>
                        <TableHead className="text-zinc-500 dark:text-zinc-400">Contact Info</TableHead>
                        <TableHead className="text-zinc-500 dark:text-zinc-400">Key Products</TableHead>
                        <TableHead className="text-zinc-500 dark:text-zinc-400">Status</TableHead>
                        <TableHead className="text-right text-zinc-500 dark:text-zinc-400">Pending Dues</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {suppliersList.map((supplier) => (
                        <TableRow key={supplier.id} className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                          <TableCell className="font-medium text-zinc-900 dark:text-zinc-300">{supplier.id}</TableCell>
                          <TableCell className="text-zinc-900 dark:text-white font-medium">{supplier.name}</TableCell>
                          <TableCell className="text-zinc-600 dark:text-zinc-300">{supplier.contact}</TableCell>
                          <TableCell className="text-zinc-500 dark:text-zinc-400 text-sm">{supplier.products}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              supplier.status === 'Active' ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10' :
                                'text-rose-600 dark:text-rose-400 border-rose-500/20 bg-rose-50 dark:bg-rose-500/10'
                            }>
                              {supplier.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-rose-600 dark:text-rose-400 font-bold">{supplier.dues}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            )}

            {/* VIEW: PURCHASE ORDERS */}
            {activeTab === "orders" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-2xl font-semibold text-zinc-900 dark:text-white">Purchase Orders</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Track incoming stock and supplier orders.</p>
                  </div>
                  <Button className="bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                    <Truck className="mr-2 h-4 w-4" /> Create PO
                  </Button>
                </div>

                <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
                  <Table>
                    <TableHeader className="bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                      <TableRow className="border-zinc-200 dark:border-zinc-800">
                        <TableHead className="w-[120px] text-zinc-500 dark:text-zinc-400">PO Number</TableHead>
                        <TableHead className="text-zinc-500 dark:text-zinc-400">Supplier</TableHead>
                        <TableHead className="text-zinc-500 dark:text-zinc-400">Items Ordered</TableHead>
                        <TableHead className="text-zinc-500 dark:text-zinc-400">Order Date</TableHead>
                        <TableHead className="text-zinc-500 dark:text-zinc-400">Status</TableHead>
                        <TableHead className="text-right text-zinc-500 dark:text-zinc-400">Total Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ordersList.map((order) => (
                        <TableRow key={order.id} className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                          <TableCell className="font-medium text-zinc-900 dark:text-zinc-300">{order.id}</TableCell>
                          <TableCell className="text-zinc-900 dark:text-white">{order.supplier}</TableCell>
                          <TableCell className="text-zinc-600 dark:text-zinc-300 text-sm">{order.items}</TableCell>
                          <TableCell className="text-zinc-500 dark:text-zinc-400 text-sm">{order.date}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              order.status === 'Delivered' ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10' :
                                'text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-50 dark:bg-amber-500/10'
                            }>
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-zinc-900 dark:text-white font-bold">{order.total}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            )}

            {/* VIEW: REPORTS & ANALYTICS */}
            {activeTab === "reports" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-2xl font-semibold text-zinc-900 dark:text-white">Business Reports</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Monthly P&L, GST summary, and low stock analytics.</p>
                  </div>
                  <Button className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                    <FileText className="mr-2 h-4 w-4" /> Download PDF
                  </Button>
                </div>

                {/* Financial KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-center shadow-sm dark:shadow-none">
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-1">Monthly P&L (Profit)</p>
                    <p className={`text-3xl font-bold ${reportsData.pnl.includes("-") ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>{reportsData.pnl}</p>
                  </Card>
                  <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-center shadow-sm dark:shadow-none">
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{reportsData.revenue}</p>
                  </Card>
                  <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-center shadow-sm dark:shadow-none">
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-1">Estimated GST</p>
                    <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{reportsData.gst}</p>
                  </Card>
                </div>

                <div className="mb-6">
                  <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none p-6">
                    <h4 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">7-Day Sales Trend</h4>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={reportsData.salesTrend}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" />
                          <XAxis dataKey="date" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                            itemStyle={{ color: '#818cf8', fontWeight: 600 }}
                            formatter={(value: any) => [`₹${value}`, 'Revenue']}
                            labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
                          />
                          <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Products */}
                  <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none p-6">
                    <h4 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Top Performing Products</h4>
                    <div className="space-y-4">
                      {reportsData.topProducts.map((prod, idx) => (
                        <div key={idx} className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 last:border-0 last:pb-0">
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-zinc-200">{prod.name}</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">{prod.sold} units sold</p>
                          </div>
                          <p className="font-bold text-zinc-900 dark:text-white">{prod.rev}</p>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Low Stock Alerts */}
                  <Card className="bg-white dark:bg-zinc-900/50 border-rose-200 dark:border-rose-900/50 shadow-sm dark:shadow-none p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-bl-full pointer-events-none"></div>
                    <div className="flex items-center gap-2 mb-4 relative z-10">
                      <AlertTriangle className="text-rose-600 dark:text-rose-400 w-5 h-5" />
                      <h4 className="text-lg font-semibold text-rose-600 dark:text-rose-400">Critical Stock Alerts</h4>
                    </div>
                    <div className="space-y-4 relative z-10">
                      {reportsData.lowStockAlerts.map((alert, idx) => (
                        <div key={idx} className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 last:border-0 last:pb-0">
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-zinc-200">{alert.name}</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">Threshold: {alert.threshold}</p>
                          </div>
                          <Badge variant="outline" className="text-rose-600 dark:text-rose-400 border-rose-500/20 bg-rose-50 dark:bg-rose-500/10">
                            {alert.current} Left
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <Button className="w-full mt-6 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 relative z-10">
                      Auto-Generate PO
                    </Button>
                  </Card>
                </div>
              </div>
            )}

            {/* VIEW: SETTINGS */}
            {activeTab === "settings" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
                <div className="mb-6">
                  <h3 className="text-2xl font-semibold text-zinc-900 dark:text-white">{t.settings}</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm">Manage your shop preferences and app configuration.</p>
                </div>

                <div className="space-y-6">
                  {/* Shop Info */}
                  <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none p-6">
                    <h4 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2"><Settings size={18} /> Shop Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Shop ID</p>
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">{SHOP_ID}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Platform</p>
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">BazaarOS v1.0</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Backend</p>
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">{process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">AI Engine</p>
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">Groq LLaMA 3.3 70B</p>
                      </div>
                    </div>
                  </Card>

                  {/* Appearance */}
                  <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none p-6">
                    <h4 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">{theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />} Appearance</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">Theme</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Toggle between dark and light mode</p>
                      </div>
                      <Button onClick={toggleTheme} variant="outline" className="border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                        {theme === 'dark' ? <><Sun size={16} className="mr-2" /> Light Mode</> : <><Moon size={16} className="mr-2" /> Dark Mode</>}
                      </Button>
                    </div>
                  </Card>

                  {/* Language */}
                  <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none p-6">
                    <h4 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2"><Globe size={18} /> Language</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">Interface Language</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Current: {t.langLabel}</p>
                      </div>
                      <Button onClick={cycleLanguage} variant="outline" className="border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                        <Globe size={16} className="mr-2" /> {t.langLabel} → Next
                      </Button>
                    </div>
                  </Card>

                  {/* About */}
                  <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none p-6">
                    <h4 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">About</h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      BazaarOS is a multilingual AI-powered ERP built for Indian MSME merchants. It features voice-driven inventory management,
                      automated sales tracking, khata (credit ledger) management, and intelligent business analytics — all powered by
                      Groq AI and Sarvam AI.
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-3">Built for GenAI Hackathon 2026 · Team Linguaverse</p>
                  </Card>
                </div>
              </div>
            )}

            {/* VIEW: FALLBACK FOR OTHER TABS */}
            {activeTab !== "dashboard" && activeTab !== "inventory" && activeTab !== "khata" && activeTab !== "sales" && activeTab !== "suppliers" && activeTab !== "orders" && activeTab !== "reports" && activeTab !== "settings" && (
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
                      onConfirm={handleConfirmAction}
                      onCancel={handleCancelAction}
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
                <Button
                  variant="ghost" size="icon"
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  disabled={isProcessingAudio}
                  className={`rounded-lg h-10 w-10 shrink-0 transition-all ${isRecording ? 'bg-rose-500 text-white animate-pulse hover:bg-rose-600' : isProcessingAudio ? 'text-amber-500 animate-spin' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
                >
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
                  onClick={() => handleSendMessage()}
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

function AgentMessage({ message, type, action, onConfirm, onCancel }: any) {
  return (
    <div className="flex gap-3 min-w-0">
      <Avatar className="w-8 h-8 mt-1 border border-zinc-200 dark:border-zinc-700/50 shrink-0">
        <AvatarFallback className={`text-xs ${type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'}`}>
          {type === 'success' ? <CheckCircle2 size={16} /> : <Bot size={16} />}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/50 p-3 rounded-2xl rounded-tl-none text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed shadow-sm break-words overflow-hidden">
          {message}
          {action && (
            <Card className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 shadow-none">
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-1">{action.action}</p>
              <div className="flex justify-between font-medium text-zinc-900 dark:text-white">
                <span>{action.item}</span>
                <span className="text-emerald-600 dark:text-emerald-400">{action.qty}</span>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={onConfirm} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs">Confirm</Button>
                <Button size="sm" variant="outline" onClick={onCancel} className="w-full border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 h-8 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800">Cancel</Button>
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
        <div className="bg-indigo-600 shadow-md shadow-indigo-600/20 text-white p-3 rounded-2xl rounded-tr-none text-sm break-words overflow-hidden max-w-[85%]">
          {message}
        </div>
      </div>
    </div>
  )
}