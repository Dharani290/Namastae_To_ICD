function validateAbhaToken(req, res, next) {
  const token = req.headers['authorization'];
  const abhaId = req.body.abhaId;

  if (!token || !abhaId) {
    return res.status(401).json({ error: 'Missing ABHA token or abhaId' });
  }

  if (!token.startsWith('Bearer ') || token.length < 20) {
    return res.status(403).json({ error: 'Invalid ABHA token' });
  }

  console.log(`✅ Consent from ${abhaId}, version ${req.body.consentVersion}, source ${req.body.sourceSystem}`);
  next();
}

module.exports = { validateAbhaToken };
