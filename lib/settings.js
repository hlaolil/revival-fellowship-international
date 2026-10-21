const { getDb } = require('./db');

// Site-wide details editable from Admin → Site Settings
const defaults = {
  phone: '+266 6223 3969',
  whatsapp: '26662233969',
  email: 'tlokza@gmail.com',
  addressLine1: 'A1 Road, Opposite Usave',
  addressLine2: 'Behind BEDCO, Butha-Buthe 400',
  country: 'Lesotho',
  mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1485.56110514829!2d28.2472789!3d-28.7689499!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNjZKWCtDNzksIEJ1dGhhLUJ1dGhl!5e0!3m2!1sen!2sls!4v1739637032866!5m2!1sen!2sls',
  facebookUrl: 'https://www.facebook.com/RevivalFellowshipInternational',
  youtubeUrl: 'https://www.youtube.com/@RevivalFellowshipInternational',
  instagramUrl: '',
  twitterUrl: '',
  sundayServiceTime: 'Every Sunday, 10:00 - 13:00',
  sundayServiceContact: '+266 5919 3208',
  midweekName: 'Wednesday Prayer Meeting',
  midweekTime: 'Every Wednesday, 17:00 - 18:00',
  midweekContact: 'Kelebone Lekunya +266 6320 6940',
  visitWelcome: 'Everyone is welcome at Revival Fellowship International. Our Sunday service includes praise and worship, prayer and teaching from the Word of God.',
  givingEnabled: false,
  givingIntro: 'Thank you for partnering with us. Your giving supports the ministry, outreach and church-planting work of RFI.',
  givingBank: '',
  givingMobile: '',
  givingNote: '',
};

const fields = Object.keys(defaults);
const CACHE_MS = 60000;
let cache = null, cachedAt = 0;

async function getSettings() {
  if (cache && Date.now() - cachedAt < CACHE_MS) return cache;
  try {
    const db = await getDb();
    const doc = await db.collection('site_content').findOne({ key: 'settings' });
    cache = { ...defaults, ...(doc || {}) };
  } catch {
    cache = { ...defaults };
  }
  cachedAt = Date.now();
  return cache;
}

async function saveSettings(body) {
  // Checkboxes are absent from a form post when unticked; other fields that
  // weren't sent keep their current value.
  const data = {};
  for (const f of fields) {
    if (typeof defaults[f] === 'boolean') data[f] = body[f] === 'on';
    else if (body[f] !== undefined) data[f] = String(body[f]).trim();
  }
  if (data.whatsapp !== undefined) data.whatsapp = data.whatsapp.replace(/\D/g, '');
  const db = await getDb();
  await db.collection('site_content').updateOne({ key: 'settings' }, { $set: data }, { upsert: true });
  cache = null;
  return getSettings();
}

module.exports = { getSettings, saveSettings, defaults };
