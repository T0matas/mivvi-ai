// Script para gerar PNG do mascote Beard
// Requer: npm install sharp (opcional) ou use o HTML fornecido

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const svgContent = `<svg
  width="400"
  height="400"
  viewBox="0 0 200 200"
  xmlns="http://www.w3.org/2000/svg"
>
  <!-- Corpo -->
  <ellipse cx="100" cy="140" rx="50" ry="45" fill="#A8D5E2" />
  
  <!-- Cabeça -->
  <circle cx="100" cy="70" r="45" fill="#A8D5E2" />
  
  <!-- Orelhas -->
  <ellipse cx="75" cy="50" rx="12" ry="15" fill="#A8D5E2" />
  <ellipse cx="125" cy="50" rx="12" ry="15" fill="#A8D5E2" />
  
  <!-- Camiseta -->
  <path
    d="M 60 120 L 60 160 L 140 160 L 140 120 L 130 120 L 130 130 L 70 130 L 70 120 Z"
    fill="#FFFFFF"
  />
  <!-- Mangas -->
  <ellipse cx="65" cy="125" rx="8" ry="12" fill="#A8D5E2" />
  <ellipse cx="135" cy="125" rx="8" ry="12" fill="#A8D5E2" />
  
  <!-- Calças -->
  <path
    d="M 70 160 L 70 190 L 85 190 L 85 160 Z"
    fill="#000000"
  />
  <path
    d="M 115 160 L 115 190 L 130 190 L 130 160 Z"
    fill="#000000"
  />
  
  <!-- Olhos -->
  <circle cx="88" cy="65" r="8" fill="#FFFFFF" />
  <circle cx="112" cy="65" r="8" fill="#FFFFFF" />
  <ellipse cx="88" cy="65" rx="5" ry="6" fill="#000000" />
  <ellipse cx="112" cy="65" rx="5" ry="6" fill="#000000" />
  
  <!-- Nariz -->
  <ellipse cx="100" cy="78" rx="4" ry="5" fill="#5B9BD5" />
  
  <!-- Boca feliz -->
  <path
    d="M 90 85 Q 100 95 110 85"
    stroke="#000000"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
  />
  
  <!-- Prancheta (na mão direita) -->
  <rect x="130" y="110" width="25" height="30" rx="2" fill="#8B4513" />
  <rect x="132" y="112" width="21" height="26" fill="#FFFFFF" />
  <line x1="135" y1="118" x2="148" y2="118" stroke="#000000" strokeWidth="1" />
  <line x1="135" y1="125" x2="148" y2="125" stroke="#000000" strokeWidth="1" />
  <line x1="135" y1="132" x2="148" y2="132" stroke="#000000" strokeWidth="1" />
  <rect x="150" y="110" width="3" height="30" fill="#C0C0C0" />
  
  <!-- Braço esquerdo -->
  <ellipse cx="60" cy="120" rx="10" ry="15" fill="#A8D5E2" />
  
  <!-- Pés -->
  <ellipse cx="77" cy="190" rx="8" ry="5" fill="#A8D5E2" />
  <ellipse cx="122" cy="190" rx="8" ry="5" fill="#A8D5E2" />
</svg>`;

// Salvar SVG
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'beard-mascot.svg'), svgContent);
console.log('✅ SVG salvo em: public/beard-mascot.svg');
console.log('\n📝 Para converter para PNG:');
console.log('   1. Abra o arquivo scripts/export-beard-png.html no navegador');
console.log('   2. Ou use uma ferramenta online como: https://convertio.co/svg-png/');
console.log('   3. Ou use o SVG em public/beard-mascot.svg');

