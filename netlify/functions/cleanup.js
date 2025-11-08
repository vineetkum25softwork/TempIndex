const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, 'links.json');
const MAX_AGE_DAYS = 14;

function isExpired(dateString) {
  const createdDate = new Date(dateString);
  const now = new Date();
  const diffTime = now - createdDate;
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays > MAX_AGE_DAYS;
}

function cleanup() {
  const data = fs.readFileSync(FILE_PATH, 'utf-8');
  const links = JSON.parse(data);
  const filtered = links.filter(link => !isExpired(link.created_time));
  fs.writeFileSync(FILE_PATH, JSON.stringify(filtered, null, 2));
  console.log(`Cleaned up. Removed ${links.length - filtered.length} expired entries.`);
}

cleanup();
