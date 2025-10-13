export default (doc, data, startY, fontSizes, lineSpacing) => {
    const pageWidth = doc.internal.pageSize.width;
    const pageCenterX = pageWidth / 2;
    let startX = 57;
    const endX = pageWidth - startX;

    // Title
    doc.setFont(doc.vars.fontFamily, doc.vars.fontWeightBold);
    doc.setFontSize(fontSizes.TitleFontSize);
    doc.text(data.labels.title, pageCenterX, startY, {align: 'center'});

    startY += lineSpacing * 2;

    // Plan date and doctor info
    doc.setFont(doc.vars.fontFamily, doc.vars.fontWeightNormal);
    doc.setFontSize(fontSizes.NormalFontSize);
    
    const dateText = `${data.labels.planDate}: ${data.plan.date}`;
    doc.text(dateText, startX, startY);

    if (data.plan.doctorName) {
        const doctorText = `${data.labels.doctor}: ${data.plan.doctorName}`;
        doc.text(doctorText, endX, startY, {align: 'right'});
    }

    startY += lineSpacing;

    // Expiry date if available
    if (data.plan.expiryDate) {
        doc.setFont(doc.vars.fontFamily, doc.vars.fontWeightNormal);
        doc.setFontSize(fontSizes.SmallFontSize);
        const expiryText = `${data.labels.expiryDate}: ${data.plan.expiryDate}`;
        doc.text(expiryText, startX, startY);
        startY += lineSpacing;
    }

    // Separator line
    doc.setDrawColor(41, 128, 185); // Blue color
    doc.setLineWidth(1);
    doc.line(startX, startY, endX, startY);
    startY += lineSpacing;

    return startY;
}

