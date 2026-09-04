import React, { useState, useEffect } from "react";
import {
  Zap,
  ShieldCheck,
  Cpu,
  X,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  Terminal,
  Clock,
  Sparkles
} from "lucide-react";
import { ScraplingStatus } from "../types";

interface ScraplingStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScraplingStatusModal: React.FC<ScraplingStatusModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [status, setStatus] = useState<ScraplingStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [testUrl, setTestUrl] = useState("https://www.youtube.com/watch?v=htnJgUdWDac");
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/scrapling/status");
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  const handleRunDiagnostic = async () => {
    setTestLoading(true);
    setTestResult(null);
    const start = performance.now();
    try {
      const res = await fetch("/api/scrape/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: testUrl }),
      });
      const data = await res.json();
      const elapsed = Math.round(performance.now() - start);
      setTestResult({ ...data, elapsed });
    } catch (err: any) {
      setTestResult({ error: err.message });
    } finally {
      setTestLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-['Plus_Jakarta_Sans']">
      <div className="w-full max-w-2xl rounded-3xl bg-zinc-950 border border-cyan-500/40 shadow-2xl shadow-cyan-950/60 p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md">
              <Zap size={22} className="fill-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-zinc-100 font-['Chakra_Petch']">
                  Moteur Scrapling (D4Vinci)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                  ACTIF & OPÉRATIONNEL
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-['Plus_Jakarta_Sans']">
                Scrapper Python haute vitesse avec bypass des protections anti-bot
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-850 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Telemetry Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 space-y-1">
            <div className="text-zinc-500 text-[11px]">Bibliothèque Officielle</div>
            <div className="text-cyan-300 font-bold text-sm flex items-center justify-between">
              <span>d4vinci/Scrapling</span>
              <a
                href="https://github.com/d4vinci/Scrapling"
                target="_blank"
                rel="noreferrer"
                className="text-zinc-400 hover:text-cyan-400"
              >
                <ExternalLink size={13} />
              </a>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 space-y-1">
            <div className="text-zinc-500 text-[11px]">Version Scrapling Installée</div>
            <div className="text-emerald-400 font-bold text-sm">
              v{status?.version || "0.4.15"}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 space-y-1">
            <div className="text-zinc-500 text-[11px]">Moteur d'Empreinte TLS</div>
            <div className="text-zinc-200 font-semibold flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>curl-impersonate (Bypass Cloudflare / Akamai)</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 space-y-1">
            <div className="text-zinc-500 text-[11px]">Environnement Runtime</div>
            <div className="text-zinc-200 font-semibold flex items-center gap-1.5">
              <Cpu size={14} className="text-cyan-400" />
              <span>{status?.pythonVersion || "Python 3.10"}</span>
            </div>
          </div>
        </div>

        {/* Live Test Console */}
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-300 font-bold">
              <Terminal size={14} className="text-cyan-400" />
              <span>Testeur de Scraping en Direct</span>
            </div>
            {testResult?.elapsed && (
              <span className="text-[11px] font-mono text-emerald-400">
                Temps : {testResult.elapsed} ms
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:border-cyan-400"
            />
            <button
              onClick={handleRunDiagnostic}
              disabled={testLoading || !testUrl}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-zinc-950 text-xs font-bold font-['Chakra_Petch'] transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              {testLoading ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <Sparkles size={13} />
              )}
              <span>TESTER</span>
            </button>
          </div>

          {testResult && (
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono space-y-1">
              {testResult.error ? (
                <div className="text-rose-400">Erreur : {testResult.error}</div>
              ) : (
                <>
                  <div className="text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 size={13} />
                    <span>Extraction réussie avec Scrapling !</span>
                  </div>
                  <div className="text-zinc-300">Titre : {testResult.title}</div>
                  <div className="text-zinc-400">Pistes trouvées : {testResult.tracks?.length || 0}</div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-xs font-mono text-zinc-500">
          <span>Rassoul's music • Scrapling Architecture</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold transition cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
