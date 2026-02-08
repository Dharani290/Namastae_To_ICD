const express = require('express');
const router = express.Router();
const { buildConceptMapFromFile } = require('../services/conceptMapBuilder');

router.get('/', (req, res) => {
  const conceptMap = buildConceptMapFromFile('bundle_with_metadata.json');
  res.json(conceptMap);
});

module.exports = router;
