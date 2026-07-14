/**
 * Shared chatbot engine utilities for both the React app and the Telegram bot.
 */

const TYPE_KEYWORDS = {
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

const STATUS_KEYWORDS = {
  'Under Repair': ['panne', 'repair', 'reparation', 'broken', 'معطوب', 'maintenance'],
  'In Storage':   ['stock', 'storage', 'stocke', 'reserve', 'spare', 'entrepot', 'مخزن'],
  'Retired':      ['retire', 'retired', 'hors service', 'obsolete', 'decommission', 'متقاعد'],
  'Active':       ['actif', 'active', 'en service', 'deployed', 'نشط'],
  'Suspended':    ['suspendu', 'suspended', 'bloque', 'locked', 'موقوف'],
};

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
  // add-command triggers so they never get mistaken for a target name
  'ajoute','ajouter','add','cree','créer','creer','new','une','un',
]);

const ADD_TRIGGERS = /^(ajoute|ajouter|add|cr[ée]e|creer|créer|new)\b/i;

function normalize(value) {
  return String(value ?? '').toLowerCase().trim();
}

export function detectTypeFilter(q) {
  const lower = String(q || '').toLowerCase();
  const matched = [];
  for (const synonyms of Object.values(TYPE_KEYWORDS)) {
    if (synonyms.some(s => lower.includes(s))) matched.push(...synonyms);
  }
  return matched;
}

export function detectStatusFilter(q) {
  const lower = String(q || '').toLowerCase();
  for (const [status, keywords] of Object.entries(STATUS_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return status;
  }
  return null;
}

export function detectIntent(q) {
  const lower = String(q || '').toLowerCase();
  return {
    isCount:   /combien|how many|كم عدد|كم|nombre de|total de|count/.test(lower),
    isCost:    /cout|cost|valeur|prix|value|worth|budget|da|montant/.test(lower),
    isSummary: /resume|overview|stats|statistique|summary|bilan|rapport|global/.test(lower),
    isPuce:    /puce|puces|sim|carte sim|ligne|phone line/.test(lower),
    isWhere:   /où|ou est|where is|location|bureau|emplacement|يوجد/.test(lower),
    isWho:     /qui|who|owner|possede|assigned|responsable|appartient|appartient a|لمن/.test(lower),
  };
}

export function extractNameFilter(question) {
  const input = String(question || '');
  const triggerPatterns = [
    /(?:de|d'|du)\s+([^\d?!.]+)/i,
    /(?:assigned to|belonging to|appartient à|appartient a|pour|à)\s+([^\d?!.]+)/i,
    /(?:qui a|who has|owner|responsable de)\s+([^\d?!.]+)/i,
  ];

  for (const pattern of triggerPatterns) {
    const match = pattern.exec(input);
    if (match) {
      const tokens = match[1].trim().split(/\s+/)
        .filter(t => t.length > 1 && !STOP_WORDS.has(t.toLowerCase()));
      if (tokens.length > 0) return tokens.map(t => t.toLowerCase());
    }
  }

  return null;
}

export function isDirectLookup(question) {
  const q = String(question || '').trim();
  if (/^\d{9,12}$/.test(q)) return true;
  if (/^[A-Z]-\d+-\d+-[A-Z0-9]+$/i.test(q)) return true;
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length <= 3 && words.every(w => !STOP_WORDS.has(w.toLowerCase()) && !/^\d+$/.test(w))) return true;
  return false;
}

export function findMatchingManagers(managers, nameTokens) {
  if (!Array.isArray(managers) || !Array.isArray(nameTokens)) return [];
  return managers.filter(m => {
    const hay = normalize(m.name);
    return nameTokens.every(tok => hay.includes(tok));
  });
}

export function directSearchMaterials(enriched, query) {
  const tokens = String(query || '').toLowerCase().trim().split(/\s+/).filter(t => t.length > 0);
  if (tokens.length === 0) return [];
  return enriched.filter(e => {
    const hay = [
      e.item.name, e.item.codification, e.item.serialNumber, e.item.type,
      e.item.notes, e.node?.name, e.manager?.name, e.department?.name,
    ].map(normalize).join(' ');
    return tokens.every(tok => hay.includes(tok));
  });
}

export function directSearchPuces(enriched, query) {
  const tokens = String(query || '').toLowerCase().trim().split(/\s+/).filter(t => t.length > 0);
  if (tokens.length === 0) return [];
  return enriched.filter(e => {
    const hay = [e.item.phoneNumber, e.node?.name, e.manager?.name, e.department?.name].map(normalize).join(' ');
    return tokens.every(tok => hay.includes(tok));
  });
}

export function filterMaterials(enriched, typeKeywords, statusFilter, nameTokens) {
  let results = Array.isArray(enriched) ? enriched : [];

  if (statusFilter) {
    results = results.filter(e => e.item.status === statusFilter);
  }

  if (Array.isArray(typeKeywords) && typeKeywords.length > 0) {
    results = results.filter(e => {
      const hay = normalize(e.item.name) + ' ' + normalize(e.item.type);
      return typeKeywords.some(kw => hay.includes(kw));
    });
  }

  if (Array.isArray(nameTokens) && nameTokens.length > 0) {
    results = results.filter(e => {
      const hay = [
        e.item.name, e.item.codification, e.item.serialNumber, e.item.type, e.item.notes,
        e.node?.name, e.manager?.name, e.department?.name,
      ].map(normalize).join(' ');
      return nameTokens.every(tok => hay.includes(tok));
    });
  }

  return results;
}

export function filterPuces(enriched, statusFilter, nameTokens) {
  let results = Array.isArray(enriched) ? enriched : [];

  if (statusFilter) {
    results = results.filter(e => e.item.status === statusFilter);
  }

  if (Array.isArray(nameTokens) && nameTokens.length > 0) {
    results = results.filter(e => {
      const hay = [e.item.phoneNumber, e.node?.name, e.manager?.name, e.department?.name].map(normalize).join(' ');
      return nameTokens.every(tok => hay.includes(tok));
    });
  }

  return results;
}

export function buildAnswer(intent, filteredMats, filteredPuces, allMaterials, allPuces, departments, typeKeywords, statusFilter) {
  const typeLabel = Array.isArray(typeKeywords) && typeKeywords.length > 0 ? ` de ce type` : '';
  const statusLabel = statusFilter ? ` (${statusFilter})` : '';

  if (intent.isSummary) {
    const counts = (Array.isArray(allMaterials) ? allMaterials : []).reduce((acc, m) => {
      acc[m.status] = (acc[m.status] || 0) + 1;
      return acc;
    }, {});
    const lines = [
      `📊 Résumé de l'inventaire`,
      ``,
      `🖥️  Équipements : ${Array.isArray(allMaterials) ? allMaterials.length : 0} au total`,
      `📱 Puces SIM   : ${Array.isArray(allPuces) ? allPuces.length : 0} au total`,
      `🏢 Départements: ${Array.isArray(departments) ? departments.length : 0}`,
      ``,
      `Statuts :`,
      ...Object.entries(counts).map(([k, v]) => `  • ${k} : ${v}`),
    ];
    return lines.join('\n');
  }

  if (intent.isPuce) {
    if (intent.isCount) return `📱 ${Array.isArray(filteredPuces) ? filteredPuces.length : 0} puce(s) trouvée(s)${statusLabel}.`;
    if (!Array.isArray(filteredPuces) || filteredPuces.length === 0) return `Aucune puce trouvée${statusLabel}.`;
    const lines = filteredPuces.slice(0, 20).map(e =>
      `📱 ${e.item.phoneNumber} | ${e.item.status} | ${e.manager?.name ?? '-'} | ${e.department?.name ?? '-'}`
    );
    const header = `${filteredPuces.length} puce(s)${statusLabel} :`;
    return [header, ...lines, filteredPuces.length > 20 ? `… et ${filteredPuces.length - 20} autre(s).` : ''].filter(Boolean).join('\n');
  }

  if (intent.isCount) return `🔢 ${Array.isArray(filteredMats) ? filteredMats.length : 0} équipement(s)${typeLabel}${statusLabel}.`;

  if (intent.isCost) {
    const total = (Array.isArray(filteredMats) ? filteredMats : []).reduce((acc, e) => acc + Number(e.item.cost ?? 0), 0);
    const top = Array.isArray(filteredMats) ? [...filteredMats].sort((a, b) => Number(b.item.cost ?? 0) - Number(a.item.cost ?? 0))[0] : undefined;
    return [
      `💰 Valeur totale${typeLabel}${statusLabel} :`,
      `   ${Array.isArray(filteredMats) ? filteredMats.length : 0} équipement(s) → ${total.toLocaleString('fr-DZ')} DA`,
      top ? `\n🏆 Plus cher : ${top.item.codification} — ${top.item.name} (${Number(top.item.cost ?? 0).toLocaleString('fr-DZ')} DA)` : '',
    ].filter(Boolean).join('\n');
  }

  if (!Array.isArray(filteredMats) || filteredMats.length === 0) {
    return `Aucun équipement trouvé${typeLabel}${statusLabel}.`;
  }

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

  const shown = filteredMats.slice(0, 20);
  const header = `${filteredMats.length} équipement(s)${typeLabel}${statusLabel} :`;
  const lines = shown.map(e =>
    `• ${e.item.codification} — ${e.item.name} | ${e.item.status} | ${e.manager?.name ?? '-'} | ${e.department?.name ?? '-'}`
  );
  const tail = filteredMats.length > 20 ? `… et ${filteredMats.length - 20} autre(s).` : '';
  return [header, ...lines, tail].filter(Boolean).join('\n');
}

// ── ADD-COMMAND SUPPORT ──

export function detectAddIntent(q) {
  return ADD_TRIGGERS.test(String(q || '').trim());
}

/**
 * Parses "ajoute une imprimante à Aya" / "add a printer for Aya" into
 * { typeKey: 'printer', nameTokens: ['aya'] }. Returns null if it can't
 * confidently detect both a device type and a target name.
 */
export function parseAddCommand(question) {
  const q = String(question || '').trim();
  if (!detectAddIntent(q)) return null;

  const lower = q.toLowerCase();
  let typeKey = null;
  for (const [key, synonyms] of Object.entries(TYPE_KEYWORDS)) {
    if (synonyms.some(s => lower.includes(s))) { typeKey = key; break; }
  }
  if (!typeKey) return null;

  const nameTokens = extractNameFilter(q);
  if (!nameTokens || nameTokens.length === 0) return null;

  return { typeKey, nameTokens };
}

// Find sub-nodes matching a name directly, or via their manager's name
export function findMatchingSubNodes(subNodes, managers, nameTokens) {
  if (!Array.isArray(subNodes) || !Array.isArray(nameTokens)) return [];

  const direct = subNodes.filter(n => nameTokens.every(t => normalize(n.name).includes(t)));
  if (direct.length > 0) return direct;

  const mgrs = findMatchingManagers(managers, nameTokens);
  if (mgrs.length === 1) {
    return subNodes.filter(n => n.managerId === mgrs[0].id);
  }
  return [];
}