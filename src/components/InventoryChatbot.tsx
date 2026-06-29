import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, MessageSquare, Database, RefreshCw } from 'lucide-react';
import type { Department, Manager, Material, Puce, SubNode } from '../types';

interface InventoryChatbotProps {
  departments: Department[];
  managers: Manager[];
  subNodes: SubNode[];
  materials: Material[];
  puces: Puce[];
  dbStatus?: { connected: boolean; dbName: string | null; fallback: boolean; error: string | null } | null;
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

interface Enriched<T> {
  item: T;
  node?: SubNode;
  manager?: Manager;
  department?: Department;
}

// ─── Keyword maps ─────────────────────────────────────────────────────────────

const TYPE_KEYWORDS: Record<string, string[]> = {
  printer:    ['imprimante', 'printer', 'طابعة', 'imprim', 'print'],
  computer:   ['ordinateur', 'computer', 'pc', 'حاسوب', 'desktop', 'tour', 'unite centrale', 'workstation'],
  laptop:     ['laptop', 'portable', 'notebook', 'حاسوب محمول'],
  monitor:    ['ecran', 'monitor', 'شاشة', 'moniteur', 'display'],
  keyboard:   ['clavier', 'keyboard', 'لوحة مفاتيح', 'clav'],
  mouse:      ['souris', 'mouse', 'الفأرة'],
  phone:      ['telephone', 'phone', 'هاتف', 'tel', 'mobile', 'gsm'],
  scanner:    ['scanner', 'scaner', 'ماسح'],
  switch:     ['switch', 'commutateur', 'محول'],
  router:     ['router', 'routeur', 'راوتر'],
  projector:  ['projecteur', 'projector', 'بروجيكتور'],
  ups:        ['ups', 'onduleur', 'alimentation'],
  camera:     ['camera', 'camra', 'caméra', 'كاميرا', 'webcam'],
  headset:    ['casque', 'headset', 'سماعة', 'headphone'],
  tablet:     ['tablette', 'tablet', 'لوح'],
  server:     ['serveur', 'server', 'خادم'],
};

const STATUS_KEYWORDS: Record<string, string[]> = {
  'Under Repair': ['panne', 'repair', 'reparation', 'broken', 'معطوب', 'maintenance'],
  'In Storage':   ['stock', 'storage', 'stocke', 'reserve', 'spare', 'entrepot', 'مخزن'],
  'Retired':      ['retire', 'retired', 'hors service', 'obsolete', 'decommission', 'متقاعد'],
  'Active':       ['actif', 'active', 'en service', 'deployed', 'نشط'],
  'Suspended':    ['suspendu', 'suspended', 'bloque', 'locked', 'موقوف'],
};

function normalize(v: unknown) {
  return String(v ?? '').toLowerCase().trim();
}

function detectTypeFilter(q: string): string[] {
  const lower = q.toLowerCase();
  const matched: string[] = [];
  for (const [, synonyms] of Object.entries(TYPE_KEYWORDS)) {
    if (synonyms.some(s => lower.includes(s))) matched.push(...synonyms);
  }
  return matched;
}

function detectStatusFilter(q: string): string | null {
  const lower = q.toLowerCase();
  for (const [status, keywords] of Object.entries(STATUS_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return status;
  }
  return null;
}

function detectIntent(q: string) {
  const lower = q.toLowerCase();
  return {
    isCount:   /combien|how many|كم عدد|كم|nombre de|total de|count/.test(lower),
    isCost:    /cout|cost|valeur|prix|value|worth|budget|da|montant/.test(lower),
    isSummary: /resume|overview|stats|statistique|summary|bilan|rapport|global/.test(lower),
    isPuce:    /puce|puces|sim|carte sim|ligne|phone line/.test(lower),
    isWhere:   /où|ou est|where is|location|bureau|emplacement|يوجد/.test(lower),
    isWho:     /qui|who|owner|possede|assigned|responsable|appartient|لمن/.test(lower),
  };
}

// Known stop-words that are never names/codes
const STOP_WORDS = new Set([
  'combien','how','many','qui','who','where','quels','quel','quelle','show','give','find',
  'imprimante','imprimantes','printer','printers','ordinateur','ordinateurs','computer','computers',
  'laptop','laptops','clavier','claviers','keyboard','keyboards','souris','mouse','ecran','ecrans',
  'monitor','monitors','panne','pannes','stock','active','retired','suspend','suspendu',
  'resume','overview','stats','statistique','valeur','cost','total','liste','list','me',
  'les','des','du','de','la','le','un','une','en','au','aux','pour','par','avec','sur','dans',
  'est','sont','a','ont','has','have','is','are','the','and','or','of','in','at','to',
  'equipements','equipement','materiel','assets','affiche','montre','donne','search','cherche','trouve',
  'quoi','what','quel','tous','toutes','tout','all','get','voir','see','tell',
  'puce','puces','sim','ligne','contrat','type','statut','status',
]);

// Returns name tokens ONLY when a trigger phrase introduces them ("de X", "pour X", etc.)
// "de puces" → stops at stop-word and returns null. "de aya lounis" → ['aya','lounis']
function extractNameFilter(question: string): string[] | null {
  const triggerPatterns = [
    /(?:de|d'|du)\s+([^\d?!.]+)/i,
    /(?:assigned to|belonging to|appartient à|appartient a|pour|à)\s+([^\d?!.]+)/i,
    /(?:qui a|who has|owner|responsable de)\s+([^\d?!.]+)/i,
  ];
  for (const pattern of triggerPatterns) {
    const match = pattern.exec(question);
    if (match) {
      const tokens = match[1].trim().split(/\s+/)
        .filter(t => t.length > 1 && !STOP_WORDS.has(t.toLowerCase()));
      if (tokens.length > 0) return tokens.map(t => t.toLowerCase());
    }
  }
  return null;
}

// Detect if the query looks like a direct lookup: a codification code, phone number, or short name
// with NO sentence structure. e.g. "sara", "L-3-4-CLV1", "0560045849"
function isDirectLookup(question: string): boolean {
  const q = question.trim();
  // Phone number
  if (/^\d{9,12}$/.test(q)) return true;
  // Codification code (e.g. T-1-2-PC1, L-3-4-CLV1, P-8-44-ECR1)
  if (/^[A-Z]-\d+-\d+-[A-Z]+\d+$/i.test(q)) return true;
  // 1-3 words, none of which are intent/stop words
  const words = q.split(/\s+/);
  if (words.length <= 3 && words.every(w => !STOP_WORDS.has(w.toLowerCase()) && !/^\d+$/.test(w))) return true;
  return false;
}

function findMatchingManagers(managers: Manager[], nameTokens: string[]): Manager[] {
  return managers.filter(m => {
    const hay = normalize(m.name);
    return nameTokens.every(tok => hay.includes(tok));
  });
}

// Direct freetext search: query tokens must ALL appear somewhere in a record's fields
function directSearchMaterials(enriched: Enriched<Material>[], query: string): Enriched<Material>[] {
  const tokens = query.toLowerCase().trim().split(/\s+/).filter(t => t.length > 0);
  return enriched.filter(e => {
    const hay = [
      e.item.name, e.item.codification, e.item.serialNumber, e.item.type,
      e.item.notes, e.node?.name, e.manager?.name, e.department?.name,
    ].map(normalize).join(' ');
    return tokens.every(tok => hay.includes(tok));
  });
}

function directSearchPuces(enriched: Enriched<Puce>[], query: string): Enriched<Puce>[] {
  const tokens = query.toLowerCase().trim().split(/\s+/).filter(t => t.length > 0);
  return enriched.filter(e => {
    const hay = [e.item.phoneNumber, e.node?.name, e.manager?.name, e.department?.name].map(normalize).join(' ');
    return tokens.every(tok => hay.includes(tok));
  });
}

function filterMaterials(
  enriched: Enriched<Material>[],
  typeKeywords: string[],
  statusFilter: string | null,
  nameTokens: string[] | null,
): Enriched<Material>[] {
  let results = enriched;
  if (statusFilter) results = results.filter(e => e.item.status === statusFilter);
  if (typeKeywords.length > 0) {
    results = results.filter(e => {
      const hay = normalize(e.item.name) + ' ' + normalize(e.item.type);
      return typeKeywords.some(kw => hay.includes(kw));
    });
  }
  if (nameTokens && nameTokens.length > 0) {
    results = results.filter(e => {
      const hay = [e.item.name, e.item.codification, e.item.serialNumber, e.item.type, e.item.notes, e.node?.name, e.manager?.name, e.department?.name].map(normalize).join(' ');
      return nameTokens.every(tok => hay.includes(tok));
    });
  }
  return results;
}

function filterPuces(enriched: Enriched<Puce>[], statusFilter: string | null, nameTokens: string[] | null): Enriched<Puce>[] {
  let results = enriched;
  if (statusFilter) results = results.filter(e => e.item.status === statusFilter);
  if (nameTokens && nameTokens.length > 0) {
    results = results.filter(e => {
      const hay = [e.item.phoneNumber, e.node?.name, e.manager?.name, e.department?.name].map(normalize).join(' ');
      return nameTokens.every(tok => hay.includes(tok));
    });
  }
  return results;
}

// ─── Pure JS answer builder — no LLM, no hallucination ───────────────────────
function buildAnswer(
  intent: ReturnType<typeof detectIntent>,
  filteredMats: Enriched<Material>[],
  filteredPuces: Enriched<Puce>[],
  allMaterials: Material[],
  allPuces: Puce[],
  departments: Department[],
  typeKeywords: string[],
  statusFilter: string | null,
): string {
  const typeLabel = typeKeywords.length > 0 ? ` de ce type` : '';
  const statusLabel = statusFilter ? ` (${statusFilter})` : '';

  // Summary
  if (intent.isSummary) {
    const counts = allMaterials.reduce<Record<string, number>>((acc, m) => {
      acc[m.status] = (acc[m.status] || 0) + 1; return acc;
    }, {});
    const lines = [
      `📊 Résumé de l'inventaire`,
      ``,
      `🖥️  Équipements : ${allMaterials.length} au total`,
      `📱 Puces SIM   : ${allPuces.length} au total`,
      `🏢 Départements: ${departments.length}`,
      ``,
      `Statuts :`,
      ...Object.entries(counts).map(([k, v]) => `  • ${k} : ${v}`),
    ];
    return lines.join('\n');
  }

  // Puces
  if (intent.isPuce) {
    if (intent.isCount) return `📱 ${filteredPuces.length} puce(s) trouvée(s)${statusLabel}.`;
    if (filteredPuces.length === 0) return `Aucune puce trouvée${statusLabel}.`;
    const lines = filteredPuces.slice(0, 20).map(e =>
      `📱 ${e.item.phoneNumber} | ${e.item.status} | ${e.manager?.name ?? '-'} | ${e.department?.name ?? '-'}`
    );
    const header = `${filteredPuces.length} puce(s)${statusLabel} :`;
    return [header, ...lines, filteredPuces.length > 20 ? `… et ${filteredPuces.length - 20} autre(s).` : ''].filter(Boolean).join('\n');
  }

  // Count
  if (intent.isCount) return `🔢 ${filteredMats.length} équipement(s)${typeLabel}${statusLabel}.`;

  // Cost / value
  if (intent.isCost) {
    const total = filteredMats.reduce((acc, e) => acc + Number(e.item.cost ?? 0), 0);
    const top = [...filteredMats].sort((a, b) => Number(b.item.cost ?? 0) - Number(a.item.cost ?? 0))[0];
    return [
      `💰 Valeur totale${typeLabel}${statusLabel} :`,
      `   ${filteredMats.length} équipement(s) → ${total.toLocaleString('fr-DZ')} DA`,
      top ? `\n🏆 Plus cher : ${top.item.codification} — ${top.item.name} (${Number(top.item.cost ?? 0).toLocaleString('fr-DZ')} DA)` : '',
    ].filter(Boolean).join('\n');
  }

  // No results
  if (filteredMats.length === 0) {
    return `Aucun équipement trouvé${typeLabel}${statusLabel}.`;
  }

  // Single result or where/who
  if (filteredMats.length === 1 || intent.isWhere || intent.isWho) {
    const e = filteredMats[0];
    return [
      `🖥️  ${e.item.name} (${e.item.codification})`,
      `   Type     : ${e.item.type}`,
      `   Statut   : ${e.item.status}`,
      `   N° Série : ${e.item.serialNumber}`,
      `   Coût     : ${Number(e.item.cost ?? 0).toLocaleString('fr-DZ')} DA`,
      `   Bureau   : ${e.node?.name ?? 'Non assigné'}${e.node?.officeNum ? ` (${e.node.officeNum})` : ''}`,
      `   Resp.    : ${e.manager?.name ?? '-'}`,
      `   Dept.    : ${e.department?.name ?? '-'}`,
      e.item.notes ? `   Notes    : ${e.item.notes}` : '',
      filteredMats.length > 1 ? `\n+ ${filteredMats.length - 1} autre(s) résultat(s).` : '',
    ].filter(Boolean).join('\n');
  }

  // List
  const shown = filteredMats.slice(0, 20);
  const header = `${filteredMats.length} équipement(s)${typeLabel}${statusLabel} :`;
  const lines = shown.map(e =>
    `• ${e.item.codification} — ${e.item.name} | ${e.item.status} | ${e.manager?.name ?? '-'} | ${e.department?.name ?? '-'}`
  );
  const tail = filteredMats.length > 20 ? `… et ${filteredMats.length - 20} autre(s).` : '';
  return [header, ...lines, tail].filter(Boolean).join('\n');
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function InventoryChatbot({
  departments,
  managers,
  subNodes,
  materials,
  puces,
  dbStatus,
  onRefresh,
  ollamaUrl: _ollamaUrl = 'http://localhost:11434',
  ollamaModel: _ollamaModel = 'llama3.2',
}: InventoryChatbotProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 1, role: 'bot',
    text: "Bonjour ! Posez-moi n'importe quelle question sur l'inventaire.\nEx: \"combien d'imprimantes ?\" • \"equipements en panne\" • \"equipements de Aya Lounis\" • \"valeur totale\"",
  }]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const enrichedMaterials = React.useMemo<Enriched<Material>[]>(() =>
    materials.map(item => {
      const node = subNodes.find(n => n.id === item.assignedNodeId);
      const manager = node ? managers.find(m => m.id === node.managerId) : undefined;
      const department = manager ? departments.find(d => d.id === manager.departmentId) : undefined;
      return { item, node, manager, department };
    }), [departments, managers, materials, subNodes]);

  const enrichedPuces = React.useMemo<Enriched<Puce>[]>(() =>
    puces.map(item => {
      const node = subNodes.find(n => n.id === item.assignedNodeId);
      const manager = node ? managers.find(m => m.id === node.managerId) : undefined;
      const department = manager ? departments.find(d => d.id === manager.departmentId) : undefined;
      return { item, node, manager, department };
    }), [departments, managers, puces, subNodes]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const sendMessage = async (question = input) => {
    const trimmed = question.trim();
    if (!trimmed) return;
    const botMsgId = Date.now() + 1;
    setInput('');
    setMessages(prev => [
      ...prev,
      { id: Date.now(), role: 'user', text: trimmed },
      { id: botMsgId, role: 'bot', text: '🔍 Recherche...', streaming: true },
    ]);

    abortRef.current = new AbortController();
    await new Promise(r => setTimeout(r, 30));

    try {
      // ── Direct lookup mode: user typed a code, phone number, or plain name ──
      if (isDirectLookup(trimmed)) {
        const matResults = directSearchMaterials(enrichedMaterials, trimmed);
        const puceResults = directSearchPuces(enrichedPuces, trimmed);

        let answer = '';
        if (matResults.length === 0 && puceResults.length === 0) {
          answer = `Aucun résultat pour "${trimmed}".`;
        } else {
          const parts: string[] = [];
          if (matResults.length > 0) {
            const intent = { isCount: false, isCost: false, isSummary: false, isPuce: false, isWhere: false, isWho: false };
            parts.push(buildAnswer(intent, matResults, [], materials, puces, departments, [], null));
          }
          if (puceResults.length > 0) {
            const lines = puceResults.map(e =>
              `📱 ${e.item.phoneNumber} | ${e.item.status} | ${e.manager?.name ?? '-'} | ${e.department?.name ?? '-'}`
            );
            parts.push(`${puceResults.length} puce(s) :\n${lines.join('\n')}`);
          }
          answer = parts.join('\n\n');
        }

        setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, streaming: false, text: answer } : m));
        return;
      }

      // ── Normal intent-based mode ──
      const intent = detectIntent(trimmed);
      const typeKeywords = detectTypeFilter(trimmed);
      const statusFilter = detectStatusFilter(trimmed);
      const nameTokens = extractNameFilter(trimmed);

      // Ambiguous name → ask to clarify
      if (nameTokens && nameTokens.length > 0) {
        const matchedManagers = findMatchingManagers(managers, nameTokens);
        if (matchedManagers.length > 1) {
          const nameList = matchedManagers.map(m => `• ${m.name}`).join('\n');
          setMessages(prev => prev.map(m =>
            m.id === botMsgId ? { ...m, streaming: false, text: `Plusieurs personnes correspondent :\n${nameList}\n\nPrécisez le nom complet svp.` } : m
          ));
          return;
        }
      }

      const filteredMats = filterMaterials(enrichedMaterials, typeKeywords, statusFilter, nameTokens);
      const filteredPucs = filterPuces(enrichedPuces, statusFilter, nameTokens);

      const answer = buildAnswer(intent, filteredMats, filteredPucs, materials, puces, departments, typeKeywords, statusFilter);

      setMessages(prev => prev.map(m =>
        m.id === botMsgId ? { ...m, streaming: false, text: answer } : m
      ));

    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setMessages(prev => prev.map(m =>
        m.id === botMsgId ? { ...m, streaming: false, text: `Erreur: ${err instanceof Error ? err.message : 'Problème inconnu'}` } : m
      ));
    }
  };

  const stopStreaming = () => {
    abortRef.current?.abort();
    setMessages(prev => prev.map(m => m.streaming ? { ...m, streaming: false } : m));
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
      setMessages(prev => [...prev, { id: Date.now(), role: 'bot', text: '✅ Données rechargées depuis la base.' }]);
    } finally { setIsRefreshing(false); }
  };

  const isStreaming = messages.some(m => m.streaming);
  const QUICK_PROMPTS = ["combien d'imprimantes ?", 'equipements en panne', 'resume general', 'puces suspendues', 'valeur totale'];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 h-12 w-12 rounded-full bg-slate-950 text-white shadow-2xl border border-white/20 flex items-center justify-center hover:bg-slate-800 transition-all cursor-pointer"
        title="Assistant inventaire"
      >
        <MessageSquare className="w-5 h-5 text-[#FF1E1E]" />
      </button>

      {open && (
        <div
          className="fixed bottom-20 right-5 z-50 w-[calc(100vw-2.5rem)] max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col"
          style={{ height: '520px' }}
        >
          {/* Header */}
          <div className="bg-slate-950 text-white px-4 py-3 flex items-center justify-between gap-3 rounded-t-2xl shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-8 w-8 rounded-xl bg-[#FF1E1E]/15 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-[#FF1E1E]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-black uppercase tracking-wider">Assistant Inventaire</h3>
                <p className="text-[10px] text-slate-300 truncate">données réelles · zéro hallucination</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Status bar */}
          <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <Database className="w-3.5 h-3.5 text-[#FF1E1E]" />
              {dbStatus?.connected ? dbStatus.dbName : 'Fallback'}
            </span>
            <button onClick={refreshData} disabled={isRefreshing} className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-slate-950 disabled:opacity-50 cursor-pointer">
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />Rafraichir
            </button>
          </div>

          {/* Messages — scrollable */}
          <div
            ref={scrollRef}
            className="flex-1 p-4 space-y-3 bg-slate-50 overflow-y-auto"
            style={{ minHeight: 0 }}
          >
            {messages.map(message => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap break-words ${
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

          {/* Input area */}
          <div className="p-3 bg-white border-t border-slate-100 rounded-b-2xl shrink-0">
            <div className="flex gap-2 mb-2 overflow-x-auto pb-1 scrollbar-hide">
              {QUICK_PROMPTS.map(prompt => (
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
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !isStreaming) { e.preventDefault(); sendMessage(); } }}
                placeholder="Posez votre question en français, english, عربي..."
                disabled={isStreaming}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none text-slate-800 placeholder:text-slate-400 disabled:opacity-50"
              />
              {isStreaming
                ? <button onClick={stopStreaming} className="h-9 w-9 rounded-xl bg-slate-800 text-white flex items-center justify-center hover:bg-slate-950 cursor-pointer shrink-0"><X className="w-4 h-4" /></button>
                : <button onClick={() => sendMessage()} disabled={!input.trim()} className="h-9 w-9 rounded-xl bg-[#FF1E1E] text-white flex items-center justify-center hover:bg-red-700 cursor-pointer disabled:opacity-40 shrink-0"><Send className="w-4 h-4" /></button>
              }
            </div>
          </div>
        </div>
      )}
    </>
  );
}
