const { getDb, toObjectId } = require('../lib/db');

const MAX_BYTES = 4 * 1024 * 1024;
const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;

// Stores a photo sent from an admin form (a base64 data URL produced by the
// browser after resizing) and returns its public path, or null if none was sent.
exports.saveUpload = async dataUrl => {
  if (!dataUrl) return null;
  const match = String(dataUrl).match(DATA_URL);
  if (!match) throw new Error('Unsupported image – please upload a JPEG, PNG or WebP photo.');
  const data = Buffer.from(match[2], 'base64');
  if (data.length > MAX_BYTES) throw new Error('Image is too large (max 4 MB).');
  const db = await getDb();
  const { insertedId } = await db.collection('media').insertOne({ contentType: match[1], data, size: data.length, uploadedAt: new Date() });
  return `/media/${insertedId}`;
};

// Removes an uploaded photo when the item using it is deleted
exports.deleteUpload = async src => {
  const m = String(src || '').match(/^\/media\/([a-f0-9]{24})$/);
  if (!m) return;
  const db = await getDb();
  await db.collection('media').deleteOne({ _id: toObjectId(m[1]) });
};

exports.show = async (req, res, next) => {
  const id = toObjectId(req.params.id);
  if (!id) return next();
  let doc = null;
  try {
    const db = await getDb();
    doc = await db.collection('media').findOne({ _id: id });
  } catch { /* no database – treat as missing */ }
  if (!doc) return next();
  const buf = typeof doc.data.read === 'function' ? Buffer.from(doc.data.read(0, doc.data.length())) : Buffer.from(doc.data);
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.type(doc.contentType).send(buf);
};
