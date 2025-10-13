import newPage from "../utils/newPage";

export default async (doc, data, startY, fontSizes, lineSpacing) => {
    let startX = 57;
    const pageWidth = doc.internal.pageSize.width;
    const endX = pageWidth - startX;

    const priceColX = endX - 70;

    // Check if new page is needed
    const neededHeight = lineSpacing * 4;
    startY = await newPage(doc, startY, neededHeight);

    // Separator line
    doc.setDrawColor(41, 128, 185);
    doc.setLineWidth(0.5);
    doc.line(startX, startY, endX, startY);

    startY += lineSpacing * 2;

    doc.setFontSize(fontSizes.NormalFontSize);
    doc.setFont(doc.vars.fontFamily, doc.vars.fontWeightBold);

    // Total label
    doc.text(data.labels.estimatedTotal, priceColX - 20, startY, {align: 'right'});

    // Total amount
    const totalText = doc.vars.totalEstimatedPrice 
        ? `${doc.vars.totalEstimatedPrice.toFixed(2)} RON`
        : '0.00 RON';
    
    doc.setFontSize(fontSizes.SubTitleFontSize);
    doc.text(totalText, endX, startY, {align: 'right'});

    // Double underline for total
    const totalWidth = doc.getStringUnitWidth(totalText) * fontSizes.SubTitleFontSize;
    const lineStartX = endX - totalWidth - 5;
    
    doc.setLineWidth(0.5);
    startY += 4;
    doc.line(lineStartX, startY, endX + 2, startY);
    startY += 2;
    doc.line(lineStartX - 2, startY, endX + 4, startY);

    startY += lineSpacing * 2;

    // Additional note about estimate
    doc.setFont(doc.vars.fontFamily, doc.vars.fontWeightNormal);
    doc.setFontSize(fontSizes.SmallFontSize);
    doc.setTextColor(100, 100, 100);
    
    const noteText = "* Prețurile și duratele sunt estimative și pot varia în funcție de complexitatea tratamentului.";
    const noteLines = doc.splitTextToSize(noteText, endX - startX);
    doc.text(noteLines, startX, startY);
    doc.setTextColor(0, 0, 0);

    return startY;
}

