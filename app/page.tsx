"use client";

import { useState, useEffect, useRef } from "react"
import {
  LayoutDashboard, Package, Wallet, Truck, Users, FileText,
  Settings, Mic, Send, AlertTriangle, Plus, Search,
  Bot, User, CheckCircle2, X, BarChart3, Receipt, FileSpreadsheet,
  BookOpen
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

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard"); // Navigation State
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- MOCK STATE DATA ---
  const [stats, setStats] = useState({
    todaySales: "₹8,240",
    salesTrend: "+12%",
    totalItems: 142,
    lowStock: 3,
    pendingOrders: 7,
    monthlyRev: "₹1.2L"
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
      id: 1,
      role: "system",
      text: "Namaste! 3 items need restocking today. Dove Soap is down to 8 units. Should I order more?",
      language: null,
      action: null
    }
  ]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAgentOpen, isTyping]);

  // Handle sending message to API
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userText = inputText.trim();
    const newUserMsg: Message = {
      id: Date.now(),
      role: "user",
      text: userText,
      language: "Hinglish",
      action: null
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputText("");
    setIsTyping(true);

    // MOCK API CALL - Smart Mocking based on keywords
    setTimeout(() => {
      setIsTyping(false);

      const lowerText = userText.toLowerCase();
      let mockResponse: Message;

      if (lowerText.includes("sales") || lowerText.includes("bikri")) {
        mockResponse = {
          id: Date.now() + 1,
          role: "agent",
          text: `Aaj ki total sales ${stats.todaySales} hai. Pichle din se ${stats.salesTrend} zyada!`,
          language: null,
          action: null
        };
      } else if (lowerText.includes("lux") || lowerText.includes("add")) {
        mockResponse = {
          id: Date.now() + 1,
          role: "agent",
          text: "Samajh gaya! Main stock update kar deta hun. Please confirm karein:",
          language: null,
          action: { item: "Lux Soap 50g", qty: "+50", action: "ADD STOCK" }
        };
      } else {
        mockResponse = {
          id: Date.now() + 1,
          role: "agent",
          text: "Ji, main detail check kar raha hun. Aapko kuch specific dekhna hai?",
          language: null,
          action: null
        };
      }

      setMessages(prev => [...prev, mockResponse]);
    }, 1500);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-300 font-sans overflow-hidden">

      {/* ================= LEFT SIDEBAR ================= */}
      <aside className="w-64 border-r border-slate-800/60 bg-slate-900/50 flex flex-col shrink-0">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">Bazaar<span className="text-indigo-500">OS</span></h1>
          <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Multilingual ERP</p>
        </div>

        <div className="px-4 mb-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 flex items-center gap-3">
            <Avatar className="w-10 h-10 rounded-md">
              <AvatarFallback className="bg-indigo-600 text-white font-bold rounded-md">R</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-white">Ravi Store</p>
              <p className="text-xs text-slate-400">Chennai, TN</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <p className="text-xs font-semibold text-slate-500 mb-2 mt-2 px-2">MAIN</p>
          <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} />
          <NavItem icon={<Package size={18} />} label="Inventory" alert active={activeTab === "inventory"} onClick={() => setActiveTab("inventory")} />
          <NavItem icon={<Wallet size={18} />} label="Sales" active={activeTab === "sales"} onClick={() => setActiveTab("sales")} />
          <NavItem icon={<BookOpen size={18} />} label="Khata (Udhaar)" active={activeTab === "khata"} onClick={() => setActiveTab("khata")} />
          <NavItem icon={<Truck size={18} />} label="Orders" active={activeTab === "orders"} onClick={() => setActiveTab("orders")} />

          <p className="text-xs font-semibold text-slate-500 mb-2 mt-6 px-2">BUSINESS</p>
          <NavItem icon={<Users size={18} />} label="Suppliers" active={activeTab === "suppliers"} onClick={() => setActiveTab("suppliers")} />
          <NavItem icon={<FileText size={18} />} label="Reports" active={activeTab === "reports"} onClick={() => setActiveTab("reports")} />
          <NavItem icon={<Settings size={18} />} label="Settings" active={activeTab === "settings"} onClick={() => setActiveTab("settings")} />
        </nav>
      </aside>

      {/* ================= CENTER PANEL ================= */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
        {/* Top Header */}
        <header className="h-20 border-b border-slate-800/60 px-8 flex items-center justify-between shrink-0 bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-white capitalize">{activeTab} Overview</h2>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 z-10" />
              <Input
                type="text"
                placeholder="Search apps or data..."
                className="pl-9 bg-slate-900 border-slate-800 text-slate-300 rounded-full focus-visible:ring-indigo-500 h-9 text-sm"
              />
            </div>
            <span className="text-sm text-slate-400">Thu, 5 Mar 2026</span>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <ScrollArea className="flex-1 p-8">

          {/* VIEW: DASHBOARD (SAP CARDS) */}
          {activeTab === "dashboard" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-10">
                <h3 className="text-lg font-medium text-white mb-4">Inventory Controller</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  <SapCard title="Manage Stock" subtitle={`${stats.totalItems} Total Items`} icon={<Package />} onClick={() => setActiveTab("inventory")} />
                  <SapCard title="Low Stock Alerts" subtitle={`${stats.lowStock} Items require attention`} icon={<AlertTriangle />} alert />
                  <SapCard title="Create Purchase Order" icon={<Plus />} />
                  <SapCard title="Supplier Ledger" subtitle="Pending dues: ₹4,200" icon={<Users />} />
                  <SapCard title="Stock Reconciliation" icon={<FileSpreadsheet />} />
                </div>
              </div>

              <div className="mb-10">
                <h3 className="text-lg font-medium text-white mb-4">Sales & Finance</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  <SapCard title="Today's Sales" subtitle={`${stats.todaySales} (${stats.salesTrend})`} icon={<Wallet />} highlight />
                  <SapCard title="Record Manual Sale" icon={<Receipt />} />
                  <SapCard title="Monthly Revenue" subtitle={stats.monthlyRev} icon={<BarChart3 />} />
                  <SapCard title="Pending Receivables" subtitle={`${stats.pendingOrders} Invoices`} icon={<FileText />} />
                </div>
              </div>
            </div>
          )}

          {/* VIEW: INVENTORY TABLE */}
          {activeTab === "inventory" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-semibold text-white">Master Inventory</h3>
                  <p className="text-slate-400 text-sm">Manage your product catalog and stock levels.</p>
                </div>

                {/* Shadcn Dialog for adding stock manually */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                      <Plus className="mr-2 h-4 w-4" /> Add Item Manually
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700 text-white">
                    <DialogHeader>
                      <DialogTitle>Add New Item</DialogTitle>
                      <DialogDescription className="text-slate-400">
                        Manually enter a new product to your inventory ledger. (Hint: It's faster to just tell the AI Agent to do this!)
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right text-slate-300">Name</Label>
                        <Input id="name" placeholder="e.g. Parle-G 50g" className="col-span-3 bg-slate-950 border-slate-700" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="sku" className="text-right text-slate-300">SKU</Label>
                        <Input id="sku" placeholder="PAR-50G" className="col-span-3 bg-slate-950 border-slate-700" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="stock" className="text-right text-slate-300">Stock Qty</Label>
                        <Input id="stock" type="number" placeholder="100" className="col-span-3 bg-slate-950 border-slate-700" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500">Save Item</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Card className="bg-slate-900/50 border-slate-800">
                <Table>
                  <TableHeader className="bg-slate-900 hover:bg-slate-900">
                    <TableRow className="border-slate-800">
                      <TableHead className="w-[100px] text-slate-400">SKU</TableHead>
                      <TableHead className="text-slate-400">Product Name</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-right text-slate-400">Price</TableHead>
                      <TableHead className="text-right text-slate-400">Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryList.map((item) => (
                      <TableRow key={item.sku} className="border-slate-800 hover:bg-slate-800/50">
                        <TableCell className="font-medium text-slate-300">{item.sku}</TableCell>
                        <TableCell className="text-white">{item.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`
                            ${item.status === 'Healthy' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : ''}
                            ${item.status === 'Low Stock' ? 'text-rose-400 border-rose-500/20 bg-rose-500/10' : ''}
                            ${item.status === 'Warning' ? 'text-amber-400 border-amber-500/20 bg-amber-500/10' : ''}
                          `}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-slate-300">{item.price}</TableCell>
                        <TableCell className="text-right text-white font-medium">{item.stock}</TableCell>
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
                  <h3 className="text-2xl font-semibold text-white">Khata (Customer Ledger)</h3>
                  <p className="text-slate-400 text-sm">Track pending payments and customer credit (Udhaar).</p>
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                  <Plus className="mr-2 h-4 w-4" /> New Customer
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-6 mb-8">
                <Card className="bg-slate-900/50 border-slate-800 p-6 flex flex-col justify-center">
                  <p className="text-slate-400 text-sm font-medium mb-1">Total Outstanding</p>
                  <p className="text-3xl font-bold text-rose-400">₹6,070</p>
                </Card>
                <Card className="bg-slate-900/50 border-slate-800 p-6 flex flex-col justify-center">
                  <p className="text-slate-400 text-sm font-medium mb-1">Active Khata Accounts</p>
                  <p className="text-3xl font-bold text-white">24</p>
                </Card>
                <Card className="bg-slate-900/50 border-slate-800 p-6 flex flex-col justify-center">
                  <p className="text-slate-400 text-sm font-medium mb-1">Recovered This Week</p>
                  <p className="text-3xl font-bold text-emerald-400">₹2,150</p>
                </Card>
              </div>

              <Card className="bg-slate-900/50 border-slate-800">
                <Table>
                  <TableHeader className="bg-slate-900 hover:bg-slate-900">
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-400">Customer Name</TableHead>
                      <TableHead className="text-slate-400">Phone</TableHead>
                      <TableHead className="text-slate-400">Last Activity</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-right text-slate-400">Balance Due</TableHead>
                      <TableHead className="text-right text-slate-400">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {khataList.map((customer) => (
                      <TableRow key={customer.id} className="border-slate-800 hover:bg-slate-800/50">
                        <TableCell className="font-medium text-white">{customer.name}</TableCell>
                        <TableCell className="text-slate-300">{customer.phone}</TableCell>
                        <TableCell className="text-slate-400 text-sm">{customer.lastActive}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={customer.status === 'Overdue' ? 'text-rose-400 border-rose-500/20 bg-rose-500/10' : 'text-amber-400 border-amber-500/20 bg-amber-500/10'}>
                            {customer.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-rose-400 font-bold">{customer.balance}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">Settle Due</Button>
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
                  <h3 className="text-2xl font-semibold text-white">Recent Sales</h3>
                  <p className="text-slate-400 text-sm">Live stream of all transactions.</p>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                  <Receipt className="mr-2 h-4 w-4" /> Record Sale
                </Button>
              </div>

              <Card className="bg-slate-900/50 border-slate-800">
                <Table>
                  <TableHeader className="bg-slate-900 hover:bg-slate-900">
                    <TableRow className="border-slate-800">
                      <TableHead className="w-[120px] text-slate-400">Invoice</TableHead>
                      <TableHead className="text-slate-400">Items Sold</TableHead>
                      <TableHead className="text-slate-400">Payment Type</TableHead>
                      <TableHead className="text-slate-400">Time</TableHead>
                      <TableHead className="text-right text-slate-400">Total Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesList.map((sale) => (
                      <TableRow key={sale.id} className="border-slate-800 hover:bg-slate-800/50">
                        <TableCell className="font-medium text-slate-300">{sale.id}</TableCell>
                        <TableCell className="text-slate-200">{sale.items}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            sale.type.includes('Khata') ? 'text-amber-400 border-amber-500/20 bg-amber-500/10' :
                              sale.type === 'Cash' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' :
                                'text-indigo-400 border-indigo-500/20 bg-indigo-500/10'
                          }>
                            {sale.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-400 text-sm">{sale.time}</TableCell>
                        <TableCell className="text-right text-white font-bold">{sale.total}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {/* VIEW: FALLBACK FOR OTHER TABS */}
          {activeTab !== "dashboard" && activeTab !== "inventory" && activeTab !== "khata" && activeTab !== "sales" && (
            <div className="flex flex-col items-center justify-center h-96 text-slate-500 animate-in fade-in duration-500">
              <Package size={48} className="mb-4 opacity-20" />
              <p className="text-lg">The <strong>{activeTab}</strong> module is currently under development.</p>
              <p className="text-sm">Check back later or use the AI Agent for tasks.</p>
            </div>
          )}

        </ScrollArea>
      </main>

      {/* ================= FLOATING AI AGENT (FAB & POPUP) ================= */}

      {/* 1. The Popup Window */}
      {isAgentOpen && (
        <Card className="fixed bottom-24 right-8 w-[400px] h-[600px] bg-slate-900 border-slate-700 shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200">
          {/* Header */}
          <div className="h-16 border-b border-slate-800 bg-slate-900/80 px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400">
                <Bot size={20} />
              </div>
              <div>
                <h2 className="text-md font-semibold text-white leading-tight">Bazaar AI Agent</h2>
                <Badge variant="outline" className="text-emerald-400 border-emerald-500/20 bg-emerald-500/10 text-[10px] gap-1.5 px-2 py-0 h-5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  Listening in Hinglish & Tamil
                </Badge>
              </div>
            </div>
            <button onClick={() => setIsAgentOpen(false)} className="text-slate-400 hover:text-white p-2">
              <X size={20} />
            </button>
          </div>

          {/* Chat History */}
          <ScrollArea className="flex-1 p-4 bg-slate-950/50">
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
                <div className="flex items-center gap-2 text-slate-500 text-sm p-2 animate-pulse">
                  <Bot size={16} /> AI is thinking...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-slate-800 bg-slate-900">
            <div className="bg-slate-950 border border-slate-700 rounded-xl flex items-end p-2 transition-all focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white rounded-lg h-10 w-10 shrink-0">
                <Mic size={20} />
              </Button>
              <Textarea
                className="flex-1 bg-transparent border-0 text-white p-2 min-h-[40px] max-h-[120px] resize-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none text-sm"
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
        className={`fixed bottom-8 right-8 h-14 w-14 rounded-full flex items-center justify-center shadow-indigo-500/20 shadow-2xl transition-all duration-300 z-50 border-2 ${isAgentOpen ? 'bg-slate-800 border-slate-700 text-slate-300 scale-90' : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-400 text-white hover:scale-105'}`}
      >
        {isAgentOpen ? <X size={24} /> : <Bot size={28} />}
      </button>

    </div>
  )
}

// --- HELPER COMPONENTS ---

function NavItem({ icon, label, active, alert, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 transition-colors ${active ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}>
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-medium text-sm">{label}</span>
      </div>
      {alert && <div className="w-2 h-2 rounded-full bg-rose-500"></div>}
    </button>
  )
}

function SapCard({ title, subtitle, icon, alert, highlight, onClick }: any) {
  return (
    <Card onClick={onClick} className={`relative group h-36 flex flex-col justify-between transition-all duration-200 bg-slate-800/40 hover:bg-slate-800 border-slate-700/50 hover:border-slate-600 ${onClick ? 'cursor-pointer' : ''} ${highlight ? 'border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : ''}`}>
      {alert && <div className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full -mt-1 -mr-1 shadow-[0_0_10px_rgba(244,63,94,0.5)] z-10"></div>}

      <CardHeader className="p-5 pb-0">
        <CardTitle className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">{title}</CardTitle>
        {subtitle && <CardDescription className="text-xs text-slate-400 mt-1">{subtitle}</CardDescription>}
      </CardHeader>

      <CardContent className="p-5 pt-0 flex justify-start items-end flex-1">
        <div className={`${highlight ? 'text-indigo-400' : 'text-slate-500'} group-hover:scale-110 transition-transform origin-bottom-left`}>
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}

function AgentMessage({ message, type, action }: any) {
  return (
    <div className="flex gap-3">
      <Avatar className="w-8 h-8 mt-1 border border-slate-700/50">
        <AvatarFallback className={`text-xs ${type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
          {type === 'success' ? <CheckCircle2 size={16} /> : <Bot size={16} />}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <div className="bg-slate-800/80 border border-slate-700/50 p-3 rounded-2xl rounded-tl-none text-sm text-slate-200 leading-relaxed shadow-sm">
          {message}
          {action && (
            <Card className="mt-3 p-3 bg-slate-900 border-slate-700">
              <p className="text-xs text-slate-500 mb-1">{action.action}</p>
              <div className="flex justify-between font-medium text-white">
                <span>{action.item}</span>
                <span className="text-emerald-400">{action.qty}</span>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs">Confirm</Button>
                <Button size="sm" variant="outline" className="w-full border-slate-600 text-slate-300 h-8 text-xs hover:bg-slate-800">Cancel</Button>
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
      <div className="flex gap-2 items-center text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">
        <Mic size={10} /> {language}
      </div>
      <div className="flex gap-3 flex-row-reverse">
        <Avatar className="w-8 h-8 mt-1 border border-slate-700/50">
          <AvatarFallback className="bg-slate-800 text-slate-400 text-xs">
            <User size={16} />
          </AvatarFallback>
        </Avatar>
        <div className="bg-indigo-600 shadow-md text-white p-3 rounded-2xl rounded-tr-none text-sm">
          {message}
        </div>
      </div>
    </div>
  )
}