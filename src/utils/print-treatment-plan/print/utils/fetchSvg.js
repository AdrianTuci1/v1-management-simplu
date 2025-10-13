export default async (src) => {
    try {
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

        return { svg, width, height };
    } catch (error) {
        console.warn(`Failed to fetch SVG from ${src}:`, error);
        return { svg: null, width: 0, height: 0 };
    }
}

