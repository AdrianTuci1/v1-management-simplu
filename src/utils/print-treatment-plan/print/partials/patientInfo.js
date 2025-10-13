export default (doc, data, startY, fontSize, lineSpacing) => {
    let startX = 57;
    const pageWidth = doc.internal.pageSize.width;
    const endX = pageWidth - startX;

    doc.setFontSize(fontSize);
    doc.setFont(doc.vars.fontFamily, doc.vars.fontWeightBold);
    
    // Patient Info Label
    doc.text(data.labels.patientInfo, startX, startY);
    startY += lineSpacing * 1.5;

    doc.setFont(doc.vars.fontFamily, doc.vars.fontWeightNormal);

    // Patient name
    doc.text(`Nume: ${data.patient.name}`, startX, startY);
    startY += lineSpacing;

    // Additional patient info in two columns
    let leftColX = startX;
    let rightColX = startX + 250;

    if (data.patient.dateOfBirth) {
        doc.text(`Data nașterii: ${data.patient.dateOfBirth}`, leftColX, startY);
    }
    
    if (data.patient.phone) {
        doc.text(`Telefon: ${data.patient.phone}`, rightColX, startY);
    }
    startY += lineSpacing;

    if (data.patient.cnp) {
        doc.text(`CNP: ${data.patient.cnp}`, leftColX, startY);
    }
    
    if (data.patient.email) {
        doc.text(`Email: ${data.patient.email}`, rightColX, startY);
    }
    startY += lineSpacing;

    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(startX, startY, endX, startY);
    startY += lineSpacing / 2;

    return startY;
}

