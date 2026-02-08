const express = require('express');
const app = express();

// Enable JSON parsing
app.use(express.json());

// Register only the search route
const searchRoute = require('./routes/search');
app.use('/api/search', searchRoute);
const conceptMapRoute = require('./routes/conceptMap');
app.use('/api/conceptmap', conceptMapRoute);
const fhirUploadRoute = require('./routes/fhirUpload');
app.use('/api/fhir/upload', fhirUploadRoute);
app.use(express.static('public'));
// Start the server
app.listen(3000, () => {
  console.log('✅ Search API running on port 3000');
});
