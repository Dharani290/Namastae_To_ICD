const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { validateAbhaToken } = require('../utils/auth');

// POST /api/fhir/upload
router.post('/', validateAbhaToken, (req, res) => {
  const bundle = req.body;

  if (!bundle || bundle.resourceType !== 'Bundle') {
    return res.status(400).json({ error: 'Invalid FHIR Bundle' });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `fhir_bundle_${timestamp}.json`;
  const filePath = path.join(__dirname, '../data', fileName);

  fs.writeFile(filePath, JSON.stringify(bundle, null, 2), (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to save bundle' });
    }

    res.json({
      message: 'FHIR Bundle uploaded and saved successfully',
      abhaId: bundle.abhaId,
      consentVersion: bundle.consentVersion,
      sourceSystem: bundle.sourceSystem,
      savedTo: filePath
    });
  });
});

module.exports = router;
