import { Button } from "@/components/ui/button"
import { Mic } from "lucide-react"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-50 gap-6">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4 tracking-tight">BazaarOS</h1>
        <p className="text-slate-400 text-lg">Cross-Lingual Micro-ERP</p>
      </div>
      
      {/* This is your new Shadcn Button! */}
      <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
        <Mic className="w-5 h-5" />
        Test Voice Agent
      </Button>
    </main>
  );
}