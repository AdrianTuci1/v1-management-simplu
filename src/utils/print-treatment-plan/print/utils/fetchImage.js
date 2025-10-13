/**
 * Încarcă o imagine (SVG, PNG, JPG, etc.) pentru utilizare în PDF
 * @param {string} src - Calea către imagine
 * @returns {Promise<{type: string, data: any, width: number, height: number}>}
 */
export default async (src) => {
    try {
        // Verifică tipul fișierului
        const extension = src.split('.').pop().toLowerCase();
        
        if (extension === 'svg') {
            // Pentru SVG-uri, folosește parserul XML
            const response = await fetch(src);
            const svgText = await response.text();
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
            const svg = svgDoc.querySelector('svg');

            if (!svg) {
                throw new Error('Invalid SVG');
            }

            const width = parseInt(svg.getAttribute('width')) || 100;
            const height = parseInt(svg.getAttribute('height')) || 100;

            return { 
                type: 'svg', 
                data: svg, 
                width, 
                height 
            };
        } else {
            // Pentru imagini normale (PNG, JPG, etc.)
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous'; // Pentru a evita probleme CORS
                
                img.onload = () => {
                    resolve({
                        type: 'image',
                        data: img,
                        width: img.width,
                        height: img.height
                    });
                };
                
                img.onerror = () => {
                    reject(new Error(`Failed to load image: ${src}`));
                };
                
                img.src = src;
            });
        }
    } catch (error) {
        console.warn(`Failed to fetch image from ${src}:`, error);
        return { type: null, data: null, width: 0, height: 0 };
    }
}

