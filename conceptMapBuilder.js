const fs = require('fs');
const path = require('path');

function buildConceptMapFromFile(filename) {
  const filePath = path.join(__dirname, '../data', filename);
  const bundle = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  const elements = bundle.entry
    .filter(e => e.resource.resourceType === 'Condition')
    .map(e => {
      const codings = e.resource.code?.coding || [];
      const namaste = codings.find(c => c.system.includes('namaste.gov.in/codes'));
      const icd = codings.find(c => c.system.includes('id.who.int/icd'));

      if (!namaste || !icd) return null;

      return {
        code: namaste.code,
        display: namaste.display || "NAMASTE Term",
        target: [{
          code: icd.code,
          display: icd.display?.replace(/<[^>]*>/g, '') || "ICD Term",
          equivalence: "equivalent"
        }]
      };
    })
    .filter(Boolean); // remove nulls

  return {
    resourceType: "ConceptMap",
    id: "namaste-to-icd11",
    source: "https://namaste.gov.in/codes",
    target: "http://id.who.int/icd",
    group: [{
      source: "NAMASTE",
      target: "ICD11",
      element: elements
    }]
  };
}

module.exports = { buildConceptMapFromFile };
