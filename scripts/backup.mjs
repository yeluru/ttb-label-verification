import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const filesToBackup = [
  'app/layout.tsx',
  'app/globals.css',
  'components/Nav.tsx',
  'components/PageHeader.tsx',
  'components/BeverageTypeSelector.tsx',
  'components/FileDropZone.tsx',
  'components/LabelFormFields.tsx',
  'components/OverallBadge.tsx',
  'components/FieldResultRow.tsx',
  'app/page.tsx',
  'app/batch/page.tsx',
];

const backupDir = '/Users/raviyeluru/.gemini/antigravity/brain/8aa64dbb-8a86-4672-a372-75fbcf0f75d9/scratch/backup';

if (!existsSync(backupDir)) {
  mkdirSync(backupDir, { recursive: true });
}

console.log('Starting backup of UI files...');
for (const file of filesToBackup) {
  const destDir = join(backupDir, file.includes('/') ? file.substring(0, file.lastIndexOf('/')) : '');
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true });
  }
  copyFileSync(file, join(backupDir, file));
  console.log(`Backed up: ${file}`);
}
console.log('Backup complete!');
