/**
 * Normalizează un număr de telefon adăugând prefixul +40 pentru România
 * @param {string} phone - Numărul de telefon de normalizat
 * @returns {string} - Numărul de telefon normalizat cu +40
 */
export const normalizePhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Elimină spațiile, cratime și alte caractere non-numerice, dar păstrează +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Dacă numărul e gol după curățare, returnează string gol
  if (!cleaned) return '';
  
  // Cazuri speciale: +400... (0 în plus după +40)
  if (cleaned.startsWith('+400')) {
    // Elimină 0-ul de după +40: +400721... -> +40721...
    return '+40' + cleaned.substring(4);
  }
  
  // Dacă începe deja cu +40, returnează-l așa
  if (cleaned.startsWith('+40')) {
    return cleaned;
  }
  
  // Cazuri speciale: 400... (0 în plus după 40)
  if (cleaned.startsWith('400')) {
    // Elimină 0-ul de după 40: 400721... -> +40721...
    return '+40' + cleaned.substring(3);
  }
  
  // Dacă începe cu 40 (fără +), adaugă +
  if (cleaned.startsWith('40')) {
    return '+' + cleaned;
  }
  
  // Dacă începe cu 0 (format local: 0721234567), înlocuiește 0 cu +40
  if (cleaned.startsWith('0')) {
    return '+40' + cleaned.substring(1);
  }
  
  // Dacă începe cu altceva (probabil 7, 8, 9 - număr fără 0), adaugă +40
  if (cleaned.match(/^[7-9]/)) {
    return '+40' + cleaned;
  }
  
  // Dacă are deja alt prefix internațional, lasă-l așa
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // În orice alt caz, adaugă +40 în față
  return '+40' + cleaned;
};

/**
 * Formatează un număr de telefon pentru afișare (cu spații)
 * @param {string} phone - Numărul de telefon normalizat
 * @returns {string} - Numărul formatat pentru afișare
 */
export const formatPhoneForDisplay = (phone) => {
  if (!phone) return '';
  
  // Asigură-te că numărul e normalizat
  const normalized = normalizePhoneNumber(phone);
  
  // Format: +40 7XX XXX XXX
  if (normalized.startsWith('+40') && normalized.length === 12) {
    return `+40 ${normalized.substring(3, 6)} ${normalized.substring(6, 9)} ${normalized.substring(9)}`;
  }
  
  return normalized;
};

/**
 * Validează un număr de telefon românesc
 * @param {string} phone - Numărul de telefon de validat
 * @returns {boolean} - True dacă numărul e valid
 */
export const validateRomanianPhone = (phone) => {
  if (!phone) return false;
  
  const normalized = normalizePhoneNumber(phone);
  
  // Număr românesc valid: +40 urmat de 9 cifre (începând cu 7, 8 sau 9)
  const romanianPhoneRegex = /^\+40[7-9]\d{8}$/;
  
  return romanianPhoneRegex.test(normalized);
};

