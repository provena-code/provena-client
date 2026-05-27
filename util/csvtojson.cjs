const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../src/data');

// Ensure the data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Replace these with your actual file paths
const csvFilePath = path.join(dataDir, 'crosswalk.csv');
const jsonFilePath = path.join(dataDir, 'crosswalk.json');

try {
  // Read CSV file
  const csvData = fs.readFileSync(csvFilePath, 'utf8');

  // Split into rows and remove empty lines
  const rows = csvData.split('\n').map(row => row.trim()).filter(row => row);

  // Extract headers (assumes first row)
  const headers = rows.shift().split(',');

  // Map remaining rows to objects
  const jsonArray = rows.map(row => {
    const values = row.split(',');
    const obj = {};
    headers.forEach((header, index) => {
      obj[header.trim()] = values[index] ? values[index].trim() : null;
    });
    return obj;
  });

  // Write JSON file
  fs.writeFileSync(jsonFilePath, JSON.stringify(jsonArray, null, 2), 'utf8');
  console.log(`Success! Converted CSV to JSON at: ${jsonFilePath}`);

} catch (error) {
  console.error('Error converting file:', error.message);
}