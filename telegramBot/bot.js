import dotenv from 'dotenv';
import { Telegraf } from 'telegraf';
import sharp from 'sharp';
import jsQR from 'jsqr';
import axios from 'axios';
import {
  detectIntent,
  detectTypeFilter,
  detectStatusFilter,
  extractNameFilter,
  isDirectLookup,
  findMatchingManagers,
  directSearchMaterials,
  directSearchPuces,
  filterMaterials,
  filterPuces,
  buildAnswer,
  detectAddIntent,
  parseAddCommand,
  findMatchingSubNodes,
} from '../shared/chatbotEngine.js';
import { initEnrichedCache, getCachedEnrichedData, refreshEnrichedCache } from './data.js';

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

const allowedUserIds = new Set(
  String(process.env.TG_ALLOWED_USER_IDS || '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean)
    .map(id => Number(id))
    .filter(Number.isFinite)
);

if (!BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is required to run the Telegram bot.');
}
if (allowedUserIds.size === 0) {
  throw new Error('TG_ALLOWED_USER_IDS is required and must contain at least one numeric Telegram user ID.');
}

const bot = new Telegraf(BOT_TOKEN);

// chatId -> { payload, targetLabel }  (in-memory, cleared on confirm/cancel or restart)
const pendingActions = new Map();

bot.use(async (ctx, next) => {
  const userId = ctx.from?.id;
  if (!userId || !allowedUserIds.has(userId)) {
    if (ctx.updateType === 'message') {
      await ctx.reply('Accès non autorisé.');
    }
    return;
  }
  return next();
});

function getCurrentData() {
  return getCachedEnrichedData();
}

// ── QR decoding: try multiple scales + EXIF rotation before giving up ──
async function tryDecode(buffer, size) {
  const pipeline = sharp(buffer).rotate();
  if (size) pipeline.resize(size, size, { fit: 'inside', withoutEnlargement: false });

  const { data, info } = await pipeline.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return jsQR(new Uint8ClampedArray(data), info.width, info.height, { inversionAttempts: 'attemptBoth' });
}

async function decodeQrFromBuffer(buffer) {
  const sizes = [null, 1200, 900, 1500, 600];
  for (const size of sizes) {
    try {
      const result = await tryDecode(buffer, size);
      if (result?.data) return result;
    } catch {
      // try next size
    }
  }
  return null;
}

function normalizeQrPayload(payload) {
  const value = String(payload || '').trim();
  if (!value) return '';

  const PREFIX = 'LUXESTILE-SECURE-ERP://[CLASS-A]::';
  const stripped = value.startsWith(PREFIX) ? value.slice(PREFIX.length) : value;

  try {
    return Buffer.from(stripped, 'base64').toString('utf8');
  } catch {
    return value;
  }
}

async function downloadWithRetry(url, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
      return Buffer.from(response.data);
    } catch (err) {
      console.error(`[QR debug] Download attempt ${attempt} failed:`, err.message);
      if (attempt === maxAttempts) throw err;
      await new Promise(r => setTimeout(r, 1500 * attempt));
    }
  }
}

function formatMaterialAnswer(materialMatches, puceMatches, materials, puces, departments) {
  const parts = [];
  if (materialMatches.length > 0) {
    const intent = { isCount: false, isCost: false, isSummary: false, isPuce: false, isWhere: false, isWho: false };
    parts.push(buildAnswer(intent, materialMatches, [], materials, puces, departments, [], null));
  }
  if (puceMatches.length > 0) {
    const lines = puceMatches.map(e =>
      `📱 ${e.item.phoneNumber} | ${e.item.status} | ${e.manager?.name ?? '-'} | ${e.department?.name ?? '-'}`
    );
    parts.push(`${puceMatches.length} puce(s) :\n${lines.join('\n')}`);
  }
  return parts.join('\n\n');
}

/**
 * ⚠️ PLACEHOLDER — replace with your real generateMaterialCodification logic.
 * This guesses a `${company}-${deptNum}-${officeNum}-${seq}` format based on
 * what the QR debug output showed (e.g. "T-101-8-01"). Verify against your
 * actual generator before relying on this for real inventory numbers.
 */
function generateCodification(company, deptNum, officeNum, existingMaterials) {
  const sameGroup = existingMaterials.filter(m =>
    m.company === company && String(m.deptNum) === String(deptNum) && String(m.officeNum) === String(officeNum)
  );
  const nextNum = String(sameGroup.length + 1).padStart(2, '0');
  return `${company}-${deptNum}-${officeNum}-${nextNum}`;
}

async function handleTextQuery(ctx, text) {
  const query = String(text || '').trim();
  const chatId = ctx.chat.id;
  const { enrichedMaterials, enrichedPuces, materials, puces, departments, managers, subNodes } = getCurrentData();

  if (query.length === 0) {
    await ctx.reply('Envoyez une question ou un code à rechercher.');
    return;
  }

  // ── Step 1: is there a pending "add" confirmation waiting? ──
  const pending = pendingActions.get(chatId);
  if (pending) {
    const lower = query.toLowerCase();
    if (/^(oui|yes|confirme|confirmer|ok)$/i.test(lower)) {
      pendingActions.delete(chatId);
      try {
        const res = await axios.post(`${API_BASE_URL}/api/materials`, pending.payload, { timeout: 10000 });
        await ctx.reply(`✅ Ajouté : ${res.data.name} (${res.data.codification}) → ${pending.targetLabel}`);
        await refreshEnrichedCache();
      } catch (err) {
        console.error('[telegramBot] Material creation failed:', err.response?.data || err.message);
        await ctx.reply(`❌ Échec de l'ajout : ${err.response?.data?.error || err.message}`);
      }
      return;
    }
    if (/^(non|no|annule|annuler|cancel)$/i.test(lower)) {
      pendingActions.delete(chatId);
      await ctx.reply('Annulé.');
      return;
    }
    await ctx.reply('Répondez "oui" pour confirmer ou "non" pour annuler l\'ajout en attente.');
    return;
  }

  // ── Step 2: is this a new "add" command? ──
  if (detectAddIntent(query)) {
    const parsed = parseAddCommand(query);
    if (!parsed) {
      await ctx.reply('Je n\'ai pas compris. Exemple : "ajoute une imprimante à Aya"');
      return;
    }

    const targets = findMatchingSubNodes(subNodes, managers, parsed.nameTokens);
    if (targets.length === 0) {
      await ctx.reply(`Aucun bureau/personne trouvé pour "${parsed.nameTokens.join(' ')}".`);
      return;
    }
    if (targets.length > 1) {
      await ctx.reply(`Plusieurs correspondances :\n${targets.map(t => `• ${t.name}`).join('\n')}\n\nPrécisez le nom complet.`);
      return;
    }

    const targetNode = targets[0];
    const manager = managers.find(m => m.id === targetNode.managerId);
    const department = manager ? departments.find(d => d.id === manager.departmentId) : undefined;

    if (!manager || !department) {
      await ctx.reply('Impossible de déterminer la société/département pour ce bureau. Ajout annulé.');
      return;
    }

    const typeLabel = parsed.typeKey.charAt(0).toUpperCase() + parsed.typeKey.slice(1);
    const company = manager.company;
    const deptNum = department.deptNum;
    const officeNum = targetNode.officeNum;

    const codification = generateCodification(company, deptNum, officeNum, materials);
    const payload = {
      id: `mat_${Date.now()}`,
      name: typeLabel,
      type: typeLabel,
      company,
      deptNum,
      officeNum,
      materialNum: codification.split('-').pop(),
      codification,
      status: 'Active',
      serialNumber: 'N/A',
      cost: 0,
      condition: 'Bon',
      assignedNodeId: targetNode.id,
    };

    pendingActions.set(chatId, { payload, targetLabel: `${targetNode.name} (${manager.name})` });
    await ctx.reply(
      `🖨️ Ajouter : ${typeLabel}\n` +
      `   → Assigné à : ${targetNode.name} (${manager.name})\n` +
      `   → Département : ${department.name}\n` +
      `   → Codification prévue : ${codification}\n\n` +
      `Confirme ? (oui / non)`
    );
    return;
  }

  // ── Step 3: normal read-only flow (unchanged) ──
  if (isDirectLookup(query)) {
    const matResults = directSearchMaterials(enrichedMaterials, query);
    const puceResults = directSearchPuces(enrichedPuces, query);

    if (matResults.length === 0 && puceResults.length === 0) {
      await ctx.reply(`Aucun résultat pour « ${query} ».`);
      return;
    }

    await ctx.reply(formatMaterialAnswer(matResults, puceResults, materials, puces, departments));
    return;
  }

  const intent = detectIntent(query);
  const typeKeywords = detectTypeFilter(query);
  const statusFilter = detectStatusFilter(query);
  const nameTokens = extractNameFilter(query);

  if (nameTokens && nameTokens.length > 0) {
    const matchedManagers = findMatchingManagers(managers, nameTokens);
    if (matchedManagers.length > 1) {
      const nameList = matchedManagers.map(m => `• ${m.name}`).join('\n');
      await ctx.reply(`Plusieurs personnes correspondent :\n${nameList}\n\nPrécisez le nom complet svp.`);
      return;
    }
  }

  const filteredMats = filterMaterials(enrichedMaterials, typeKeywords, statusFilter, nameTokens);
  const filteredPuces = filterPuces(enrichedPuces, statusFilter, nameTokens);
  const answer = buildAnswer(intent, filteredMats, filteredPuces, materials, puces, departments, typeKeywords, statusFilter);

  await ctx.reply(answer);
}

async function handlePhotoQuery(ctx) {
  const photos = ctx.message?.photo;
  if (!Array.isArray(photos) || photos.length === 0) {
    await ctx.reply('Aucune photo détectée dans le message.');
    return;
  }

  const photo = photos[photos.length - 1];
  const fileLink = await ctx.telegram.getFileLink(photo.file_id);

  let buffer;
  try {
    buffer = await downloadWithRetry(fileLink.toString());
  } catch (err) {
    await ctx.reply('Connexion instable, réessayez svp.');
    return;
  }

  const qrCode = await decodeQrFromBuffer(buffer);
  if (!qrCode || !qrCode.data) {
    await ctx.reply('Impossible de lire le QR code. Essayez d\'envoyer l\'image en tant que Fichier (pas Photo) pour éviter la compression.');
    return;
  }

  const extracted = normalizeQrPayload(qrCode.data);
  const { enrichedMaterials, enrichedPuces, materials, puces, departments } = getCurrentData();
  const matResults = directSearchMaterials(enrichedMaterials, extracted);

  if (matResults.length > 0) {
    await ctx.reply(buildAnswer({ isCount: false, isCost: false, isSummary: false, isPuce: false, isWhere: false, isWho: false }, matResults, [], materials, puces, departments, [], null));
    return;
  }

  const puceResults = directSearchPuces(enrichedPuces, extracted);
  if (puceResults.length > 0) {
    await ctx.reply(formatMaterialAnswer([], puceResults, materials, puces, departments));
    return;
  }

  await ctx.reply(`Aucun matériel ou puce trouvé pour « ${extracted} ».`);
}

async function handleDocumentQuery(ctx) {
  const doc = ctx.message?.document;
  if (!doc) {
    await ctx.reply('Aucun fichier détecté.');
    return;
  }
  if (!doc.mime_type?.startsWith('image/')) {
    await ctx.reply('Merci d\'envoyer une image (photo ou fichier image).');
    return;
  }

  const fileLink = await ctx.telegram.getFileLink(doc.file_id);
  let buffer;
  try {
    buffer = await downloadWithRetry(fileLink.toString());
  } catch (err) {
    await ctx.reply('Connexion instable, réessayez svp.');
    return;
  }

  const qrCode = await decodeQrFromBuffer(buffer);
  if (!qrCode || !qrCode.data) {
    await ctx.reply('Impossible de lire le QR code dans ce fichier.');
    return;
  }

  const extracted = normalizeQrPayload(qrCode.data);
  const { enrichedMaterials, enrichedPuces, materials, puces, departments } = getCurrentData();
  const matResults = directSearchMaterials(enrichedMaterials, extracted);

  if (matResults.length > 0) {
    await ctx.reply(buildAnswer({ isCount: false, isCost: false, isSummary: false, isPuce: false, isWhere: false, isWho: false }, matResults, [], materials, puces, departments, [], null));
    return;
  }
  const puceResults = directSearchPuces(enrichedPuces, extracted);
  if (puceResults.length > 0) {
    await ctx.reply(formatMaterialAnswer([], puceResults, materials, puces, departments));
    return;
  }
  await ctx.reply(`Aucun matériel ou puce trouvé pour « ${extracted} ».`);
}

bot.start(async ctx => {
  await ctx.reply('Bonjour! Envoyez un message, une photo de QR code, ou "ajoute [type] à [nom]" pour créer un équipement.');
});

bot.help(async ctx => {
  await ctx.reply(
    'Envoyez un code d\'inventaire, un numéro de téléphone ou une question de type « combien », « valeur », ' +
    '« puce », « où », « qui ».\n\nPour ajouter un équipement : "ajoute une imprimante à Aya" (une confirmation vous sera demandée).'
  );
});

bot.on('text', async ctx => {
  try {
    await handleTextQuery(ctx, ctx.message.text);
  } catch (err) {
    console.error('[telegramBot] Text handler failed:', err);
    await ctx.reply('Erreur interne lors du traitement de la requête.');
  }
});

bot.on('photo', async ctx => {
  try {
    await handlePhotoQuery(ctx);
  } catch (err) {
    console.error('[telegramBot] Photo handler failed:', err);
    await ctx.reply('Erreur interne lors de la lecture du QR code.');
  }
});

bot.on('document', async ctx => {
  try {
    await handleDocumentQuery(ctx);
  } catch (err) {
    console.error('[telegramBot] Document handler failed:', err);
    await ctx.reply('Erreur interne lors de la lecture du fichier.');
  }
});

bot.command('refresh', async ctx => {
  try {
    await refreshEnrichedCache();
    await ctx.reply('Cache d\'inventaire rafraîchi.');
  } catch (err) {
    console.error('[telegramBot] Cache refresh failed:', err);
    await ctx.reply('Impossible de rafraîchir le cache pour le moment.');
  }
});

await initEnrichedCache({ refreshIntervalMs: Number(process.env.TELEGRAM_CACHE_INTERVAL_MS || '180000') });

bot.launch().then(() => {
  console.log('[telegramBot] Bot lancé en mode polling.');
}).catch(err => {
  console.error('[telegramBot] Échec du lancement du bot:', err);
  process.exit(1);
});

process.once('SIGINT', () => {
  bot.stop('SIGINT');
  process.exit(0);
});

process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
  process.exit(0);
});