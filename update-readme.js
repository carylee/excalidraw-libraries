#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function updateReadmeWithImageTable() {
  console.log('🔄 Updating README with image preview table...');

  const readmePath = path.join(__dirname, 'README.md');
  const previewsDir = path.join(__dirname, 'previews');
  
  if (!fs.existsSync(readmePath)) {
    console.error('❌ README.md not found');
    return;
  }

  if (!fs.existsSync(previewsDir)) {
    console.error('❌ previews/ directory not found. Run "npm run generate" first.');
    return;
  }

  // Get all PNG files from previews directory
  const imageFiles = fs.readdirSync(previewsDir)
    .filter(file => file.endsWith('.png'))
    .sort();

  if (imageFiles.length === 0) {
    console.error('❌ No preview images found. Run "npm run generate" first.');
    return;
  }

  // Read current README
  let readmeContent = fs.readFileSync(readmePath, 'utf8');

  // Generate image table
  const tableHeader = `## 🖼️ Library Preview

| Item | Preview |
|------|---------|`;

  const tableRows = imageFiles.map(filename => {
    const itemNumber = filename.replace('item-', '').replace('.png', '');
    const relativePath = `previews/${filename}`;
    return `| ${itemNumber} | ![${filename}](${relativePath}) |`;
  }).join('\n');

  const imageTable = `${tableHeader}\n${tableRows}`;

  // Find existing image table section and replace it, or add at the end
  const imageTableRegex = /## 🖼️ Library Preview[\s\S]*?(?=\n## |\n$|$)/;
  
  if (imageTableRegex.test(readmeContent)) {
    // Replace existing table
    readmeContent = readmeContent.replace(imageTableRegex, imageTable);
    console.log('✅ Updated existing image table');
  } else {
    // Add new table at the end
    readmeContent = readmeContent.trim() + '\n\n' + imageTable + '\n';
    console.log('✅ Added new image table');
  }

  // Write updated README
  fs.writeFileSync(readmePath, readmeContent);
  console.log(`🎉 README updated with ${imageFiles.length} preview images`);
}

if (require.main === module) {
  updateReadmeWithImageTable();
}

module.exports = { updateReadmeWithImageTable };