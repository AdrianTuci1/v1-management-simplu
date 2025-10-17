# Configurarea PWA (Progressive Web App)

Această aplicație a fost configurată ca PWA folosind **Workbox** prin plugin-ul `vite-plugin-pwa`.

## 📋 Caracteristici PWA

- ✅ **Instalabilă** - Utilizatorii pot instala aplicația pe dispozitivele lor
- ✅ **Funcționează offline** - Cache-uire inteligentă a resurselor
- ✅ **Auto-update** - Service worker-ul se actualizează automat
- ✅ **Icoane adaptive** - Icoane optimizate pentru toate platformele
- ✅ **Cache stratificat** - Strategii diferite pentru diferite tipuri de resurse

## 🔧 Configurare

### 1. Manifest PWA
Manifestul se găsește în `/public/manifest.json` și conține:
- Nume și descriere aplicație
- Icoane în diferite dimensiuni (72x72 până la 512x512)
- Tema și culori
- Modul de afișare (standalone)

### 2. Service Worker (Workbox)
Configurația se află în `vite.config.js` și include:

#### Strategii de Cache:

1. **CacheFirst** - Pentru fonturi și imagini
   - Google Fonts (1 an)
   - Imagini statice (30 zile)

2. **NetworkFirst** - Pentru API requests
   - Timeout: 10 secunde
   - Fallback la cache dacă network-ul eșuează
   - Expirare: 5 minute

#### Opțiuni Workbox:
```javascript
{
  registerType: 'autoUpdate',
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true
}
```

### 3. Meta Tags
În `index.html` sunt configurate:
- Meta tags PWA standard
- Apple Touch Icons
- Theme color
- Mobile app capabilities

## 🚀 Utilizare

### Development
Service worker-ul este activat și în modul development:
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Preview Build
```bash
npm run preview
```

## 📱 Instalare

### Desktop (Chrome/Edge):
1. Deschideți aplicația în browser
2. Căutați iconița "Instalează" în bara de adrese
3. Click pe "Instalează"

### Mobile (iOS/Android):
1. Deschideți aplicația în browser
2. iOS: Safari → Share → Add to Home Screen
3. Android: Chrome → Menu → Install App

## 🔍 Verificare PWA

### Chrome DevTools:
1. Deschideți DevTools (F12)
2. Mergeți la tab-ul "Application"
3. Verificați:
   - Manifest
   - Service Workers
   - Cache Storage

### Lighthouse Audit:
```bash
npm run build
npm run preview
# Apoi rulați Lighthouse din Chrome DevTools
```

## 📦 Resurse Cache-uite

### Automat (Precache):
- HTML, CSS, JS files
- Imagini statice
- Icoane PWA

### Runtime Cache:
- Google Fonts
- Imagini dinamice
- API responses (cu timeout)

## 🔄 Actualizări

Service worker-ul folosește `autoUpdate`:
- Se verifică automat pentru actualizări
- Se actualizează în background
- Utilizatorul primește cea mai recentă versiune la următoarea încărcare

## 🛠️ Regenerare Icoane

Dacă doriți să regenerați iconițele PWA:

1. Instalați sharp (dacă nu e deja):
```bash
npm install -D sharp
```

2. Creați și rulați scriptul:
```javascript
// generate-icons.js
import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { join } from 'path';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputImage = join(process.cwd(), 'public', 'Frame-1.png');
const outputDir = join(process.cwd(), 'public', 'icons');

mkdirSync(outputDir, { recursive: true });

for (const size of sizes) {
  await sharp(inputImage)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    })
    .png()
    .toFile(join(outputDir, `icon-${size}x${size}.png`));
}
```

```bash
node generate-icons.js
```

## 🎯 Best Practices

1. **Testați offline functionality** - Dezactivați network-ul în DevTools
2. **Verificați cache size** - Monitorizați dimensiunea cache-ului
3. **Update policies** - Stabiliți politici clare de actualizare
4. **Error handling** - Gestionați erorile de network corespunzător

## 📚 Documentație Suplimentară

- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)

## 🐛 Troubleshooting

### Service Worker nu se actualizează:
```javascript
// În DevTools → Application → Service Workers
// Click "Update" sau "Unregister"
```

### Cache-ul nu se șterge:
```javascript
// În DevTools → Application → Storage
// Click "Clear site data"
```

### PWA nu apare ca instalabilă:
- Verificați că HTTPS este activat (sau localhost pentru dev)
- Verificați că manifestul este valid
- Verificați că iconițele sunt accesibile
- Verificați că service worker-ul este înregistrat

