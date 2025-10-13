export default async (doc, startY, neededHeight) => {
    const pageHeight = doc.internal.pageSize.height;
    const pageCenterX = doc.internal.pageSize.width / 2;
    const bottomMargin = 140; // Space for footer

    if (startY + neededHeight > pageHeight - bottomMargin) {
        doc.addPage();

        // Add background to new page if available
        if (doc.vars.bgImage && doc.vars.bgImageWidth) {
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(doc.vars.bgImage, 'image/svg+xml');
            const svg = svgDoc.querySelector('svg');
            
            if (svg) {
                await doc.svg(svg, {
                    x: pageCenterX - doc.vars.bgImageWidth / 2,
                    y: 250
                });
            }
        }

        startY = 80; // Reset Y position for new page
    }

    return startY;
}

