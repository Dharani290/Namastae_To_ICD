function search() {
  const code = document.getElementById('searchBox').value;
  const resultsBox = document.getElementById('searchResults');
  resultsBox.textContent = "🔍 Searching...";

  fetch(`/api/search?code=${encodeURIComponent(code)}`)
    .then(res => res.json())
    .then(data => {
      if (!Array.isArray(data) || data.length === 0) {
        resultsBox.textContent = "❌ No matches found.";
        return;
      }

      let output = "";
      data.forEach((item, index) => {
        const namasteCode = item.namaste_code || "N/A";
        const namasteTerm = item.namaste_term || "NAMASTE Code";
        const icdUri = item.icd_code || "N/A";
        const icdCode = icdUri.split('/').pop();
        const icdTerm = item.icd_term || "ICD Term";
        const tm2Label = item.tm2_label || "N/A";
        const noteText = item.confidence_note || "";
        const confidenceMatch = noteText.match(/Confidence[:：]?\s*([\d.]+)/);
        const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0;

        output += `🩺 Match ${index + 1}\n`;
        output += `NAMASTE: ${namasteCode} - ${namasteTerm}\n`;
        output += `ICD-11: ${icdCode} - ${icdTerm}\n`;
        output += `TM2 Label: ${tm2Label}\n`;
        output += `Confidence: ${confidence}\n\n`;
      });

      resultsBox.textContent = output;
    })
    .catch(err => {
      resultsBox.textContent = "⚠️ Error fetching results.";
      console.error("Search fetch error:", err);
    });
}

function uploadBundle() {
  const file = document.getElementById('bundleFile').files[0];
  const token = document.getElementById('abhaToken').value;
  const statusBox = document.getElementById('uploadStatus');

  if (!file || !token) {
    statusBox.textContent = "⚠️ Please select a file and enter ABHA token.";
    return;
  }

  statusBox.textContent = "📤 Uploading bundle...";

  const reader = new FileReader();
  reader.onload = function() {
    fetch('/api/fhir/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: reader.result
    })
    .then(res => res.text())
    .then(data => {
      statusBox.textContent = `✅ Upload successful:\n${data}`;
    })
    .catch(err => {
      statusBox.textContent = "❌ Upload failed.";
      console.error("Upload error:", err);
    });
  };
  reader.readAsText(file);
}

function loadConceptMap() {
  const mapBox = document.getElementById('conceptMap');
  const query = document.getElementById('conceptSearch')?.value?.toLowerCase() || "";
  mapBox.textContent = "🗺️ Loading ConceptMap...";

  fetch('/api/conceptmap')
    .then(res => res.json())
    .then(data => {
      if (!data.group || !Array.isArray(data.group) || data.group.length === 0) {
        mapBox.textContent = "❌ No ConceptMap data found.";
        return;
      }

      let output = "";
      data.group.forEach((group, i) => {
        const source = group.source || "Unknown Source";
        const target = group.target || "Unknown Target";
        let groupOutput = `🔗 Group ${i + 1}: ${source} → ${target}\n`;

        let matchCount = 0;
        if (Array.isArray(group.element)) {
          group.element.forEach((el, j) => {
            const sourceCode = el.code || "";
            const sourceDisplay = el.display || "";
            const targetObj = el.target?.[0] || {};
            const icdUri = targetObj.code || "N/A";
            const icdCode = icdUri.split('/').pop();
            const targetDisplay = targetObj.display || "ICD Term";
            const equivalence = targetObj.equivalence || "unspecified";

            const matchText = `${sourceCode} ${sourceDisplay}`.toLowerCase();
            if (!query || matchText.includes(query)) {
              matchCount++;
              groupOutput += `  ${matchCount}. ${sourceCode} - ${sourceDisplay} → ${icdCode} (${targetDisplay}) (${equivalence})\n`;
             
            }
          });
        }

        if (matchCount > 0) {
          output += groupOutput + "\n";
        }
      });

      mapBox.textContent = output || "❌ No matches found for your search.";
    })
    .catch(err => {
      mapBox.textContent = "⚠️ Error loading ConceptMap.";
      console.error("ConceptMap fetch error:", err);
    });
}
document.addEventListener('DOMContentLoaded', () => {
  // Trigger search when Enter is pressed in diagnosis box
  const searchBox = document.getElementById('searchBox');
  if (searchBox) {
    searchBox.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        search();
      }
    });
  }

  // Trigger ConceptMap load when Enter is pressed in concept search
  const conceptSearch = document.getElementById('conceptSearch');
  if (conceptSearch) {
    conceptSearch.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        loadConceptMap();
      }
    });
  }

  // Trigger bundle upload when Enter is pressed in ABHA token field
  const abhaToken = document.getElementById('abhaToken');
  if (abhaToken) {
    abhaToken.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        uploadBundle();
      }
    });
  }
});

