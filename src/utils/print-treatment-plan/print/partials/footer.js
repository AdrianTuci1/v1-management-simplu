export default (doc, data, fontSize, lineSpacing) => {
    const pageHeight = doc.internal.pageSize.height;
    let startY = pageHeight - 100;

    let startX = 57;
    const pageWidth = doc.internal.pageSize.width;
    const endX = pageWidth - startX;
    const thirdX = (pageWidth - startX * 2) / 3;

    // Separator line
    doc.setDrawColor(41, 128, 185);
    doc.setLineWidth(0.5);
    doc.line(startX, startY, endX, startY);
    startY += lineSpacing;

    doc.setFontSize(fontSize);
    doc.setFont(doc.vars.fontFamily, doc.vars.fontWeightNormal);

    // Clinic Contact Details (Left Column)
    let currentX = startX;
    doc.setFont(doc.vars.fontFamily, doc.vars.fontWeightBold);
    doc.text(data.clinic.name, currentX, startY);
    doc.setFont(doc.vars.fontFamily, doc.vars.fontWeightNormal);
    
    startY += lineSpacing;
    doc.text(data.clinic.address, currentX, startY);
    startY += lineSpacing;
    doc.text(data.clinic.city, currentX, startY);

    // Contact Info (Middle Column)
    startY = pageHeight - 100 + lineSpacing;
    currentX = startX + thirdX;
    doc.setFont(doc.vars.fontFamily, doc.vars.fontWeightBold);
    doc.text('Contact', currentX, startY);
    doc.setFont(doc.vars.fontFamily, doc.vars.fontWeightNormal);
    
    startY += lineSpacing;
    doc.text(`Tel: ${data.clinic.phone}`, currentX, startY);
    startY += lineSpacing;
    doc.text(`Email: ${data.clinic.email}`, currentX, startY);

    // Additional Info (Right Column)
    startY = pageHeight - 100 + lineSpacing;
    currentX = startX + thirdX * 2;
    doc.setFont(doc.vars.fontFamily, doc.vars.fontWeightBold);
    doc.text('Informații', currentX, startY);
    doc.setFont(doc.vars.fontFamily, doc.vars.fontWeightNormal);
    
    startY += lineSpacing;
    if (data.clinic.website) {
        doc.text(data.clinic.website, currentX, startY);
        startY += lineSpacing;
    }
    if (data.clinic.cui) {
        doc.text(`CUI: ${data.clinic.cui}`, currentX, startY);
    }
}

