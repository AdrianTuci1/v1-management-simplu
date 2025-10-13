import newPage from '../utils/newPage';

export default async (doc, data, startY, fontSize, lineSpacing) => {
    let startX = 57;
    const pageWidth = doc.internal.pageSize.width;
    const endX = pageWidth - startX;

    // Column positions
    const col1X = startX; // Order number
    const col2X = startX + 30; // Tooth number
    const col3X = startX + 90; // Treatment name
    const col4X = endX - 140; // Duration
    const col5X = endX - 70; // Price
    const col6X = endX; // Source

    doc.setFontSize(fontSize);
    doc.setFont(doc.vars.fontFamily, doc.vars.fontWeightBold);

    // Table Header
    startY += lineSpacing;
    doc.text('#', col1X, startY);
    doc.text(data.labels.toothNumber, col2X, startY);
    doc.text(data.labels.treatment, col3X, startY);
    doc.text(data.labels.duration, col4X, startY, {align: 'right'});
    doc.text(data.labels.price, col5X, startY, {align: 'right'});
    doc.text(data.labels.source, col6X, startY, {align: 'right'});

    startY += lineSpacing / 2;
    doc.setDrawColor(41, 128, 185);
    doc.setLineWidth(0.5);
    doc.line(startX, startY, endX, startY);
    startY += lineSpacing;

    // Table Body
    doc.setFont(doc.vars.fontFamily, doc.vars.fontWeightNormal);

    const treatments = data.treatments;
    let totalEstimatedPrice = 0;

    for (let i = 0; i < treatments.length; i++) {
        const treatment = treatments[i];
        
        // Calculate height needed for this row
        const titleLines = doc.splitTextToSize(
            treatment.title,
            col4X - col3X - 10
        );
        const titleHeight = titleLines.length * doc.internal.getLineHeight();
        
        let notesHeight = 0;
        if (treatment.notes) {
            const notesLines = doc.splitTextToSize(
                treatment.notes,
                col4X - col3X - 10
            );
            notesHeight = notesLines.length * doc.internal.getLineHeight();
        }

        const rowHeight = Math.max(titleHeight + notesHeight + lineSpacing, lineSpacing * 2);

        // Check if new page is needed
        startY = await newPage(doc, startY, rowHeight);

        // Order number
        doc.setFont(doc.vars.fontFamily, doc.vars.fontWeightBold);
        doc.text(String(i + 1), col1X, startY);
        doc.setFont(doc.vars.fontFamily, doc.vars.fontWeightNormal);

        // Tooth number
        const toothDisplay = treatment.toothNumber >= 100 
            ? data.labels.generalTreatment 
            : `${treatment.toothNumber || '-'}`;
        doc.text(toothDisplay, col2X, startY);

        // Treatment title (bold)
        doc.setFont(doc.vars.fontFamily, doc.vars.fontWeightBold);
        doc.text(titleLines, col3X, startY);
        
        // Treatment notes (normal, smaller)
        if (treatment.notes) {
            const notesY = startY + titleHeight;
            doc.setFont(doc.vars.fontFamily, doc.vars.fontWeightNormal);
            doc.setFontSize(fontSize - 1);
            doc.setTextColor(100, 100, 100);
            const notesLines = doc.splitTextToSize(
                treatment.notes,
                col4X - col3X - 10
            );
            doc.text(notesLines, col3X, notesY);
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(fontSize);
        }

        doc.setFont(doc.vars.fontFamily, doc.vars.fontWeightNormal);

        // Duration
        const durationText = treatment.durationMinutes 
            ? `${treatment.durationMinutes} min` 
            : '-';
        doc.text(durationText, col4X, startY, {align: 'right'});

        // Price
        const priceText = treatment.price 
            ? `${treatment.price.toFixed(2)} RON` 
            : '-';
        doc.text(priceText, col5X, startY, {align: 'right'});

        if (treatment.price) {
            totalEstimatedPrice += treatment.price;
        }

        // Source (from chart or manual)
        const sourceText = treatment.isFromChart 
            ? data.labels.fromChart 
            : data.labels.manual;
        doc.setFontSize(fontSize - 1);
        doc.setTextColor(100, 100, 100);
        doc.text(sourceText, col6X, startY, {align: 'right'});
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(fontSize);

        startY += rowHeight;
    }

    // Store total for summary
    doc.vars.totalEstimatedPrice = totalEstimatedPrice;

    return startY;
}

