const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Helper to strip HTML tags from display fields
const stripHtml = (text) => text.replace(/<[^>]*>/g, '');

const fhirPath = path.join(__dirname, '../data/fhir_conditions.json');

router.get('/', (req, res) => {
  const query = req.query.code?.toLowerCase();
  if (!query) {
    return res.status(400).json({ error: 'Missing ?code= parameter' });
  }

  fs.readFile(fhirPath, 'utf-8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to load FHIR data' });
    }

    let fhirData;
    try {
      fhirData = JSON.parse(data);
    } catch (parseErr) {
      return res.status(500).json({ error: 'Invalid JSON format in fhir_conditions.json' });
    }

    const results = fhirData.filter(cond =>
      cond.code?.coding?.some(coding =>
        coding.code?.toLowerCase().includes(query) ||
        coding.display?.toLowerCase().includes(query)
      )
    );

    if (results.length === 0) {
      return res.status(404).json([]);
    }

    const formatted = results.map(cond => {
      const icd = cond.code.coding.find(c => c.system.includes('id.who.int/icd'));
      const namaste = cond.code.coding.find(c => c.system.includes('namaste.gov.in/codes'));
      const tm2 = cond.code.coding.find(c => c.system.includes('namaste.gov.in/tm2'));
      const note = cond.note?.[0]?.text || '';

      return {
        namaste_code: namaste?.code || "N/A",
        namaste_term: stripHtml(namaste?.display || "NAMASTE Code"),
        icd_code: icd?.code || "N/A",
        icd_term: stripHtml(icd?.display || "ICD Term"),
        tm2_label: stripHtml(tm2?.code || "N/A"),
        confidence_note: note
      };
    });

    res.json(formatted);
  });
});

module.exports = router;
