import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, MessageSquare, Database, RefreshCw, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import type { Department, Manager, Material, Puce, SubNode } from '../types';

interface InventoryChatbotProps {
  departments: Department[];
  managers: Manager[];
  subNodes: SubNode[];
  materials: Material[];
  puces: Puce[];
  dbStatus?: {
    connected: boolean;
    dbName: string | null;
    fallback: boolean;
    error: string | null;
  } | null;
  onRefresh: () => Promise<void>;
  ollamaUrl?: string;
  ollamaModel?: string;
}

interface ChatMessage {
  id: number;
  role: 'bot' | 'user';
  text: string;
  streaming?: boolean;
}

function buildInventoryContext(
  departments: Department[],
  managers: Manager[],
  subNodes: SubNode[],
  materials: Material[],
  puces: Puce[],
): string {
  const materialLines = materials.map((m) => {
    const node = subNodes.find((n) => n.id === m.assignedNodeId);
    const manager = node ? managers.find((mg) => mg.id === node.managerId) : undefined;
    const dept = manager ? departments.find((d) => d.id === manager.departmentId) : undefined;
    return [
      `ID:${m.id}`,
      `Code:${m.codification}`,
      `Nom:${m.name}`,
      `Type:${m.type}`,
      `Statut:${m.status}`,
      `SN:${m.serialNumber}`,
      `Cout:${m.cost ?? 0} DA`,
      `Noeud:${node?.name ?? 'Non assigne'}`,
      `Bureau:${node?.officeNum ?? '-'}`,
      `Responsable:${manager?.name ?? '-'}`,
      `Departement:${dept?.name ?? '-'}`,
      `Notes:${m.notes ?? ''}`,
    ].join(' | ');
  });

  const puceLines = puces.map((p) => {
    const node = subNodes.find((n) => n.id === p.assignedNodeId);
    const manager = node ? managers.find((mg) => mg.id === node.managerId) : undefined;
    const dept = manager ? departments.find((d) => d.id === manager.departmentId) : undefined;
    return [
      `Tel:${p.phoneNumber}`,
      `Statut:${p.status}`,
      `PUK:${p.pukCode}`,
      `Noeud:${node?.name ?? 'Non assigne'}`,
      `Responsable:${manager?.name ?? '-'}`,
      `Departement:${dept?.name ?? '-'}`,
    ].join(' | ');
  });

  const deptLines = departments.map((d) => {
    const deptManagers = managers.filter((m) => m.departmentId === d.id);
    const mgrIds = new Set(deptManagers.map((m) => m.id));
    const nodeIds = new Set(subNodes.filter((n) => mgrIds.has(n.managerId)).map((n) => n.id));
    const assetCount = materials.filter((m) => nodeIds.has(m.assignedNodeId)).length;
    return `Dept: ${d.name} (${d.deptNum}) | Responsables: ${deptManagers.length} | Equipements: ${assetCount}`;
  });

  return `=== INVENTAIRE TECHNOCERAM ===
Date: ${new Date().toLocaleDateString('fr-DZ')}
Total equipements: ${materials.length} | Total puces: ${puces.length} | Departements: ${departments.length} | Noeuds: ${subNodes.length}

--- DEPARTEMENTS ---
${deptLines.join('\n')}

--- EQUIPEMENTS (${materials.length}) ---
${materialLines.join('\n')}

--- PUCES / CARTES SIM (${puces.length}) ---
${puceLines.join('\n')}
=== FIN INVENTAIRE ===`;
}

const SYSTEM_PROMPT = (inventoryContext: string) =>
  `Tu es un assistant intelligent pour la gestion d'inventaire de TECHNOCERAM.
Tu reponds en francais par defaut, mais tu comprends aussi l'arabe, l'anglais et le melange des trois.
Tu reponds toujours dans la meme langue que l'utilisateur.

Voici l'inventaire complet et a jour:

${inventoryContext}

Instructions:
- Reponds directement aux questions sur l'inventaire en te basant UNIQUEMENT sur les donnees ci-dessus.
- Pour les comptages: compte precisement dans les donnees fournies, ne devine pas.
- Comprends les synonymes multilingues: imprimante=printer=طابعة, ordinateur=PC=computer=حاسوب, telephone=puce=sim=هاتف, bureau=office=مكتب, panne=broken=en reparation=معطوب=Under Repair, stock=stocke=In Storage=مخزن.
- Pour rechercher une personne comme "Aya Maria": cherche uniquement les entrees ou TOUS les mots correspondent (Aya ET Maria), pas l'un ou l'autre.
- Pour les statuts: Active=actif, "Under Repair"=en panne, "In Storage"=en stock, Retired=hors service, Suspended=suspendu.
- Si une information n'est pas dans les donnees, dis-le clairement sans inventer.
- Sois concis. Pour les listes > 10 items, donne le total et les 5 premiers exemples.
- Ne fabrique jamais de donnees absentes de l'inventaire.`;

export default function InventoryChatbot({
  departments,
  managers,
  subNodes,
  materials,
  puces,
  dbStatus,
  onRefresh,
  ollamaUrl = 'http://localhost:11434',
  ollamaModel = 'llama3.2',
}: InventoryChatbotProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<'unknown' | 'online' | 'offline'>('unknown');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: 'bot',
      text: "Bonjour ! Posez-moi n'importe quelle question sur l'inventaire en francais, anglais ou عربي.\nEx: \"combien d'imprimantes ?\" • \"qui a le laptop de Aya Maria ?\" • \"كم عدد الأجهزة المعطوبة ؟\"",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!open || ollamaStatus !== 'unknown') return;
    checkOllama();
  }, [open]);

  const checkOllama = async () => {
    try {
      const res = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
      setOllamaStatus(res.ok ? 'online' : 'offline');
    } catch {
      setOllamaStatus('offline');
    }
  };

  const sendToOllama = async (userMessage: string) => {
    const inventoryContext = buildInventoryContext(departments, managers, subNodes, materials, puces);

    const history = messages
      .slice(-10)
      .filter((m) => !m.streaming)
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

    const body = {
      model: ollamaModel,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT(inventoryContext) },
        ...history,
        { role: 'user', content: userMessage },
      ],
      stream: true,
      options: {
        temperature: 0.15,
        num_ctx: 8192,
      },
    };

    abortRef.current = new AbortController();

    const res = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: abortRef.current.signal,
    });

    if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
    return res.body!.getReader();
  };

  const sendMessage = async (question = input) => {
    const trimmed = question.trim();
    if (!trimmed) return;

    const botMsgId = Date.now() + 1;
    setInput('');
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: 'user', text: trimmed },
      { id: botMsgId, role: 'bot', text: '', streaming: true },
    ]);

    try {
      const reader = await sendToOllama(trimmed);
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value, { stream: true }).split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            if (json.message?.content) {
              fullText += json.message.content;
              setMessages((prev) =>
                prev.map((m) => (m.id === botMsgId ? { ...m, text: fullText } : m)),
              );
            }
            if (json.done) {
              setMessages((prev) =>
                prev.map((m) => (m.id === botMsgId ? { ...m, streaming: false } : m)),
              );
            }
          } catch { }
        }
      }

      if (!fullText) throw new Error('Reponse vide');
      setOllamaStatus('online');
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const isOffline = err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'));
      setOllamaStatus(isOffline ? 'offline' : 'online');
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? {
                ...m,
                streaming: false,
                text: isOffline
                  ? `Ollama est hors ligne. Verifiez que le serveur tourne sur ${ollamaUrl}.\nCommande: OLLAMA_HOST=0.0.0.0 ollama serve`
                  : `Erreur: ${err instanceof Error ? err.message : 'Probleme inconnu'}`,
              }
            : m,
        ),
      );
    }
  };

  const stopStreaming = () => {
    abortRef.current?.abort();
    setMessages((prev) => prev.map((m) => (m.streaming ? { ...m, streaming: false } : m)));
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), role: 'bot', text: 'Donnees rechargees depuis la base.' },
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const isStreaming = messages.some((m) => m.streaming);

  const QUICK_PROMPTS = [
    "combien d'imprimantes ?",
    'equipements en panne',
    'resume general',
    'puces suspendues',
    'valeur totale',
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 h-12 w-12 rounded-full bg-slate-950 text-white shadow-2xl border border-white/20 flex items-center justify-center hover:bg-slate-800 transition-all cursor-pointer"
        title="Assistant inventaire IA"
      >
        <MessageSquare className="w-5 h-5 text-[#FF1E1E]" />
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-[calc(100vw-2.5rem)] max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          <div className="bg-slate-950 text-white px-4 py-3 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-8 w-8 rounded-xl bg-[#FF1E1E]/15 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-[#FF1E1E]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-black uppercase tracking-wider">Assistant Inventaire IA</h3>
                <p className="text-[10px] text-slate-300 truncate">
                  {ollamaModel} · 100% local · zero API externe
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer" title="Fermer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <Database className="w-3.5 h-3.5 text-[#FF1E1E]" />
                {dbStatus?.connected ? dbStatus.dbName : 'Fallback memoire'}
              </span>
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
                ollamaStatus === 'online' ? 'text-emerald-600' :
                ollamaStatus === 'offline' ? 'text-red-500' : 'text-slate-400'
              }`}>
                {ollamaStatus === 'online' ? <><Wifi className="w-3 h-3" />IA OK</> :
                 ollamaStatus === 'offline' ? <><WifiOff className="w-3 h-3" />IA hors ligne</> :
                 <><AlertCircle className="w-3 h-3" />IA ?</>}
              </span>
            </div>
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-slate-950 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              Rafraichir
            </button>
          </div>

          {ollamaStatus === 'offline' && (
            <div className="px-4 py-2 bg-red-50 border-b border-red-100 shrink-0">
              <p className="text-[11px] text-red-700 font-medium">
                Ollama inaccessible sur <code className="bg-red-100 px-1 rounded">{ollamaUrl}</code>.
                Lancez: <code className="bg-red-100 px-1 rounded">OLLAMA_HOST=0.0.0.0 ollama serve</code>
              </p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 min-h-0 h-80">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                  message.role === 'user'
                    ? 'bg-slate-950 text-white'
                    : 'bg-white text-slate-800 border border-slate-200'
                }`}>
                  {message.text}
                  {message.streaming && (
                    <span className="inline-block w-1.5 h-3.5 bg-slate-400 ml-0.5 animate-pulse rounded-sm align-middle" />
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-slate-100 shrink-0">
            <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => !isStreaming && sendMessage(prompt)}
                  disabled={isStreaming}
                  className="shrink-0 px-2.5 py-1 rounded-full border border-slate-200 text-[10px] font-bold text-slate-500 hover:text-slate-950 hover:bg-slate-50 cursor-pointer disabled:opacity-40"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !isStreaming) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Posez votre question en francais, english, عربي..."
                disabled={isStreaming}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none text-slate-800 placeholder:text-slate-400 disabled:opacity-50"
              />
              {isStreaming ? (
                <button
                  onClick={stopStreaming}
                  className="h-9 w-9 rounded-xl bg-slate-800 text-white flex items-center justify-center hover:bg-slate-950 transition-all cursor-pointer shrink-0"
                  title="Arreter"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim()}
                  className="h-9 w-9 rounded-xl bg-[#FF1E1E] text-white flex items-center justify-center hover:bg-red-700 transition-all cursor-pointer disabled:opacity-40 shrink-0"
                  title="Envoyer"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
