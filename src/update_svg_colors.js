const fs = require('fs');
const path = require('path');

// SVG UI - remplacer fill="white" par la variable CSS
const uiSvgs = [
  'assets/icons/Menubar/logo.svg',
  'assets/icons/Bottombar/stack-tool.svg',
  'assets/icons/Bottombar/metro-tool.svg',
  'assets/icons/Sidebar/home.svg',
  'assets/icons/Sidebar/projet.svg',
  'assets/icons/Sidebar/stack.svg'
];

uiSvgs.forEach(svgPath => {
  const fullPath = path.join(__dirname, svgPath);
  if (!fs.existsSync(fullPath)) {
    console.log('Non trouvé: ' + svgPath);
    return;
  }
  let content = fs.readFileSync(fullPath, 'utf8');
  // Remplacer fill="white" par la variable CSS
  content = content.replace(/fill="white"/g, 'fill="hsl(var(--tl-accent-princ))"');
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('✓ ' + svgPath);
});

// Overlay metronome
const overlayPath = path.join(__dirname, 'components/led-display/assets/led-overlay.svg');
if (fs.existsSync(overlayPath)) {
  let content = fs.readFileSync(overlayPath, 'utf8');
  content = content.replace(/fill="white"/g, 'fill="hsl(var(--tl-accent-overlay))"');
  fs.writeFileSync(overlayPath, content, 'utf8');
  console.log('✓ Overlay mis à jour');
}

console.log('Terminé');
