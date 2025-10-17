# Ghid de Testare PWA

## 🧪 Verificare Configurare PWA

### 1. Build și Preview

```bash
# Build aplicația
npm run build

# Preview build-ul
npm run preview
```

### 2. Verificare în Browser

#### Chrome DevTools:
1. Deschideți aplicația în Chrome/Edge
2. Apăsați `F12` pentru DevTools
3. Navigați la **Application** tab

#### Verificări:

##### ✅ Manifest
- Application → Manifest
- Verificați că toate câmpurile sunt completate corect
- Verificați că iconițele sunt vizibile

##### ✅ Service Worker
- Application → Service Workers
- Verificați că SW este înregistrat și activ
- Status ar trebui să fie "activated and is running"

##### ✅ Cache Storage
- Application → Cache Storage
- Ar trebui să vedeți cache-uri:
  - `workbox-precache-v2-[hash]` - resurse precache-uite
  - `google-fonts-cache` - după încărcarea fonturilor
  - `images-cache` - după încărcarea imaginilor
  - `api-cache` - după request-uri API

### 3. Test Instalare

#### Desktop (Chrome/Edge):
1. Căutați iconița **"+Instalează"** în bara de adrese (dreapta)
2. Click pe "Instalează aplicația"
3. Aplicația se va deschide într-o fereastră separată

#### Mobile (Chrome Android):
1. Deschideți aplicația în Chrome
2. Meniu → "Instalează aplicația" sau "Add to Home screen"
3. Confirmați instalarea

#### iOS (Safari):
1. Deschideți aplicația în Safari
2. Buton Share (săgeată în sus)
3. "Add to Home Screen"
4. Confirmați adăugarea

### 4. Test Funcționalitate Offline

1. Deschideți aplicația
2. În DevTools → Network tab
3. Setați "Offline" din dropdown (sau "Slow 3G" pentru test)
4. Refresh pagina
5. Aplicația ar trebui să se încarce din cache

**Notă:** Prima încărcare trebuie să fie online pentru a instala service worker-ul.

### 5. Test Update

#### Simulare update disponibil:
1. Faceți un build nou după modificări:
   ```bash
   npm run build
   ```
2. Service worker-ul vechi va detecta versiunea nouă
3. Ar trebui să apară notificarea de update
4. Click pe "Actualizează acum"

### 6. Lighthouse Audit

1. DevTools → Lighthouse tab
2. Selectați:
   - ✅ Performance
   - ✅ Accessibility
   - ✅ Best Practices
   - ✅ SEO
   - ✅ Progressive Web App
3. Click "Generate report"
4. Verificați scorul PWA (ar trebui să fie 90+)

## 📊 Criterii PWA

Pentru ca aplicația să fie considerată PWA, trebuie să îndeplinească:

- ✅ **HTTPS** (sau localhost pentru development)
- ✅ **Service Worker** înregistrat
- ✅ **Manifest Web App** valid
- ✅ **Icoane** în mai multe dimensiuni
- ✅ **Responsive design**
- ✅ **Funcționează offline** (cel puțin pagina principală)

## 🔧 Debugging

### Service Worker nu se înregistrează:
```javascript
// În Console:
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers:', registrations);
});
```

### Cache nu se populează:
```javascript
// În Console:
caches.keys().then(keys => {
  console.log('Cache keys:', keys);
  keys.forEach(key => {
    caches.open(key).then(cache => {
      cache.keys().then(requests => {
        console.log(\`\${key}: \${requests.length} items\`);
      });
    });
  });
});
```

### Force update service worker:
```javascript
// Application → Service Workers → Click "Update"
// SAU
// Application → Service Workers → Click "Unregister"
// Apoi refresh pagina
```

### Clear cache:
```javascript
// Application → Storage → "Clear site data"
```

## 🚨 Probleme Comune

### 1. Iconița de instalare nu apare
**Cauză:** PWA criteria nu sunt îndeplinite
**Soluție:**
- Verificați HTTPS (sau localhost)
- Verificați că manifestul e valid
- Verificați că iconițele există
- Verificați că SW e activ

### 2. Aplicația nu funcționează offline
**Cauză:** Resursele nu sunt cache-uite
**Soluție:**
- Verificați cache storage în DevTools
- Verificați configurația Workbox în `vite.config.js`
- Asigurați-vă că resursele sunt în `globPatterns`

### 3. Update-ul nu apare
**Cauză:** SW nu detectează schimbări
**Soluție:**
- Hard refresh: `Ctrl+Shift+R` (sau `Cmd+Shift+R`)
- Unregister SW și refresh
- Verificați că build-ul s-a făcut cu hash diferit

### 4. Build fail cu eroare "exceeding the limit"
**Cauză:** Fișierele sunt prea mari pentru precache
**Soluție:**
- Măriți `maximumFileSizeToCacheInBytes` în config
- SAU folosiți runtime caching în loc de precache
- SAU optimizați bundle size

## 📱 Test pe Dispozitive Reale

### Android:
1. Build și preview: `npm run preview`
2. Găsiți IP-ul local: `ipconfig getifaddr en0` (Mac) sau `ipconfig` (Windows)
3. Deschideți `http://[IP]:4173` pe telefon
4. Testați instalarea și offline

### iOS:
Similar cu Android, dar:
- iOS necesită HTTPS pentru unele features
- Puteți folosi [ngrok](https://ngrok.com/) pentru HTTPS local:
  ```bash
  npx ngrok http 4173
  ```

## ✅ Checklist Final

- [ ] Build-ul reușește fără erori
- [ ] Service worker e înregistrat în DevTools
- [ ] Manifestul apare corect în Application tab
- [ ] Toate iconițele sunt vizibile
- [ ] Cache storage se populează
- [ ] Aplicația funcționează offline (după prima încărcare)
- [ ] Iconița de instalare apare
- [ ] Aplicația se instalează pe desktop
- [ ] Aplicația se instalează pe mobile
- [ ] Update prompt apare la build nou
- [ ] Lighthouse PWA score > 90

## 📚 Resurse

- [Workbox Strategies](https://developer.chrome.com/docs/workbox/modules/workbox-strategies/)
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [PWA Builder](https://www.pwabuilder.com/) - Test online
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

## 🎯 Performance Tips

1. **Lazy load** componente mari
2. **Code splitting** pentru reducerea bundle-ului
3. **Image optimization** - folosiți WebP
4. **Precache** doar resursele esențiale
5. **Runtime cache** pentru REST API și assets dinamice

