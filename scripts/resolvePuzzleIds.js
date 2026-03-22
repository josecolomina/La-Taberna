// scripts/resolvePuzzleIds.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../src/data');
const FILES_TO_PROCESS = ['puzzles.json', 'boardClears.json', 'mulliganScenarios.json'];
const CARDS_URL = 'https://api.hearthstonejson.com/v1/latest/enUS/cards.json';
const CACHE_PATH = path.join(__dirname, '.cards_cache.json');

async function getCardsDB() {
  if (fs.existsSync(CACHE_PATH)) {
    console.log('📦 Leyendo base de datos desde caché local...');
    const data = fs.readFileSync(CACHE_PATH, 'utf-8');
    return JSON.parse(data);
  }

  console.log('🌐 Descargando base de datos de cartas desde HearthstoneJSON...');
  const res = await fetch(CARDS_URL);
  if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
  const cards = await res.json();

  fs.writeFileSync(CACHE_PATH, JSON.stringify(cards));
  console.log('✅ Base de datos cacheada localmente en .cards_cache.json');
  return cards;
}

function resolvePlaceholders(obj, cardsMap) {
  if (Array.isArray(obj)) {
    return obj.map(item => resolvePlaceholders(item, cardsMap));
  } else if (obj !== null && typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) {
      newObj[key] = resolvePlaceholders(obj[key], cardsMap);
    }
    return newObj;
  } else if (typeof obj === 'string' && obj.endsWith('_ID')) {
    const nameToSearch = obj.replace(/_ID$/, '').replace(/_/g, ' ').toLowerCase();
    
    // Exact match in map
    if (cardsMap.has(nameToSearch)) {
      const match = cardsMap.get(nameToSearch);
      console.log(`✅ Resolvido: ${obj} -> ${match.id} (${match.name})`);
      return match.id;
    } else {
      console.warn(`⚠️ Aviso: No se encontró la carta para el placeholder "${obj}" (Buscado como: "${nameToSearch}")`);
      return obj; // Leave untouched
    }
  }
  return obj;
}

async function run() {
  try {
    const cards = await getCardsDB();
    
    // Create a map for faster case-insensitive lookup: name -> full card object
    // If there are multiple versions (e.g. Core, Classic, expansions) try to prefer the standard/most recent but picking the first one is generally fine for standard names
    const cardsMap = new Map();
    for (const card of cards) {
      if (!card.name) continue;
      const key = card.name.toLowerCase();
      // Solo mantener el primero que encontremos (HearthstoneJSON suele ordenar por set ID)
      if (!cardsMap.has(key)) {
        cardsMap.set(key, card);
      }
    }

    console.log(`\n🔍 Iniciando escaneo de placeholders en archivos JSON...`);
    let totalResolved = 0;

    for (const filename of FILES_TO_PROCESS) {
      const file = path.join(DATA_DIR, filename);
      if (!fs.existsSync(file)) {
        console.warn(`⏭️ Archivo ignorado (no encontrado): ${filename}`);
        continue;
      }
      
      const raw = fs.readFileSync(file, 'utf-8');
      const data = JSON.parse(raw);
      
      const updatedData = resolvePlaceholders(data, cardsMap);
      
      // Chequeo estúpido pero efectivo de mutación (si el JSON final difiere del inicial)
      const newRaw = JSON.stringify(updatedData, null, 2) + "\n";
      if (raw !== newRaw) {
        fs.writeFileSync(file, newRaw);
        console.log(`💾 Guardados los cambios en: ${filename}`);
      } else {
        console.log(`✨ Todo limpio en: ${filename}`);
      }
    }
    
    console.log(`\n🎉 Completado.`);
  } catch (err) {
    console.error(`❌ Error fatal:`, err);
    process.exit(1);
  }
}

run();
