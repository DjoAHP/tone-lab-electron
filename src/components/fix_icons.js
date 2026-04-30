const fs = require('fs');
const path = require('path');

// Fichiers à traiter
const files = ['BottomBar.tsx', 'HomeButton.tsx', 'Sidebar.tsx', 'SoundResearchTool.tsx', 'NewStackModal.tsx'];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.log(`Fichier non trouvé: ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Ajouter l'import SvgIcon s'il n'existe pas déjà
  if (!content.includes('import { SvgIcon }') && !content.includes('import {SvgIcon}')) {
    // Trouver la dernière ligne d'import
    const importLines = content.match(/^import .+$/gm);
    if (importLines) {
      const lastImport = importLines[importLines.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport) + lastImport.length;
      
      // Ajouter l'import après la dernière ligne d'import
      const before = content.substring(0, lastImportIndex);
      const after = content.substring(lastImportIndex);
      content = before + '\nimport { SvgIcon } from "./SvgIcon";' + after;
    }
  }
  
  // 2. Remplacer les usages d'icônes comme <PianoIcon ... /> par <SvgIcon src={PianoIcon} ... />
  const iconNames = ['PianoIcon', 'TromboneIcon', 'TrompetteIcon', 'MicroIcon', 'RhodesIcon', 'SynthetiseurIcon', 'DrumIcon', 'TomIcon', 'ProjetIcon', 'StackIcon', 'HomeIcon', 'MetroIcon', 'StackIcon', 'LogoIcon'];
  
  iconNames.forEach(iconName => {
    // Remplacer <IconName ... /> par <SvgIcon src={IconName} ... />
    const regex = new RegExp(`<${iconName}([^>]*)/>`, 'g');
    content = content.replace(regex, `<SvgIcon src={${iconName}}$1 />`);
    
    // Remplacer <IconName ... > ... </IconName> par <SvgIcon src={IconName} ... > ... </SvgIcon>
    const regex2 = new RegExp(`<${iconName}([^>]*)>([\s\S]*?)</${iconName}>`, 'g');
    content = content.replace(regex2, `<SvgIcon src={${iconName}}$1>${'$2'}</SvgIcon>`);
  });
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fichier traité: ${file}`);
});

console.log('Terminé');
