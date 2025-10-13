import jsPDF from 'jspdf';
import addFontNormal from '../../print/fonts/WorkSans-normal';
import addFontBold from '../../print/fonts/WorkSans-bold';
import 'svg2pdf.js';
import fetchImage from './utils/fetchImage';
import header from './partials/header';
// import patientInfo from './partials/patientInfo'; // Not used - privacy requirement
import treatmentTable from './partials/treatmentTable';
import summary from './partials/summary';
import footer from './partials/footer';

/**
 * @param {TreatmentPlanData} treatmentPlanData
 * @returns {void}
 */
export function printTreatmentPlanPDF(treatmentPlanData) {
    addFontNormal();
    addFontBold();

    const doc = new jsPDF('p', 'pt');
    doc.vars = {};
    doc.vars.fontFamily = 'WorkSans';
    doc.vars.fontWeightBold = 'bold';
    doc.vars.fontWeightNormal = 'normal';

    doc.setFont(doc.vars.fontFamily);

    // <><>><><>><>><><><><><>>><><<><><><><>
    // SETTINGS
    // <><>><><>><>><><><><><>>><><<><><><><>

    const fontSizes = {
        TitleFontSize: 16,
        SubTitleFontSize: 12,
        NormalFontSize: 10,
        SmallFontSize: 9
    };
    const lineSpacing = 12;

    let startY = 80; // Start after logo/header

    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const pageCenterX = pageWidth / 2;

    // <><>><><>><>><><><><><>>><><<><><><><>
    // Generate PDF without invoice background
    // Treatment plans don't need the invoice background SVG
    // <><>><><>><>><><><><><>>><><<><><><><>
    
    (async () => {
        try {
            // Initialize without background to avoid "invoice" text
            doc.vars.bgImageWidth = null;
            doc.vars.bgImage = null;

            // <><>><><>><>><><><><><>>><><<><><><><>
            // Header with title
            startY = header(doc, treatmentPlanData, startY, fontSizes, lineSpacing);

            // <><>><><>><>><><><><><>>><><<><><><><>
            // Patient information - REMOVED for privacy
            // startY += 10;
            // startY = patientInfo(doc, treatmentPlanData, startY, fontSizes.NormalFontSize, lineSpacing);

            // <><>><><>><>><><><><><>>><><<><><><><>
            // Treatment Table
            startY += 20;
            startY = await treatmentTable(doc, treatmentPlanData, startY, fontSizes.NormalFontSize, lineSpacing);

            // <><>><><>><>><><><><><>>><><<><><><><>
            // Summary with totals
            startY = await summary(doc, treatmentPlanData, startY, fontSizes, lineSpacing);

            // <><>><><>><>><><><><><>>><><<><><><><>
            // Footer
            footer(doc, treatmentPlanData, fontSizes.SmallFontSize, lineSpacing);

            // <><>><><>><>><><><><><>>><><<><><><><>
            // REPEATED PAGE COMPONENTS
            // <><>><><>><>><><><><><>>><><<><><><><>

            const pagesCount = doc.internal.getNumberOfPages();

            // <><>><><>><>><><><><><>>><><<><><><><>
            // Logo on each page (supports SVG, PNG, JPG)
            // Try both .svg and .png/.jpg extensions
            const tryLoadLogo = async () => {
                const logoSources = [
                    'img/logo.svg',
                    'img/logo.png',
                    'img/logo.jpg',
                    '3dark.webp', // Try clinic logo
                ];
                
                for (const logoSrc of logoSources) {
                    try {
                        const result = await fetchImage(logoSrc);
                        if (result.type && result.data) {
                            return { ...result, src: logoSrc };
                        }
                    } catch (e) {
                        // Try next source
                        continue;
                    }
                }
                return null;
            };
            
            const logoLoaded = tryLoadLogo().then(async (logoData) => {
                if (logoData) {
                    let n = 0;
                    const maxLogoWidth = 150; // Maximum width for logo
                    const logoY = 25;
                    
                    // Calculate scaled dimensions
                    let logoWidth = logoData.width;
                    let logoHeight = logoData.height;
                    
                    if (logoWidth > maxLogoWidth) {
                        const scale = maxLogoWidth / logoWidth;
                        logoWidth = maxLogoWidth;
                        logoHeight = logoHeight * scale;
                    }
                    
                    while (n < pagesCount) {
                        n++;
                        doc.setPage(n);

                        if (logoData.type === 'svg') {
                            // For SVG, use svg2pdf
                            await doc.svg(logoData.data, {
                                x: pageCenterX - logoWidth / 2,
                                y: logoY,
                                width: logoWidth,
                                height: logoHeight
                            });
                        } else if (logoData.type === 'image') {
                            // For regular images (PNG, JPG), use addImage
                            // Create canvas to get image data
                            const canvas = document.createElement('canvas');
                            canvas.width = logoData.data.width;
                            canvas.height = logoData.data.height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(logoData.data, 0, 0);
                            const imgData = canvas.toDataURL('image/png');
                            
                            doc.addImage(
                                imgData,
                                'PNG',
                                pageCenterX - logoWidth / 2,
                                logoY,
                                logoWidth,
                                logoHeight
                            );
                        }

                        if (treatmentPlanData.clinic.website) {
                            doc.link(
                                pageCenterX - logoWidth / 2, 
                                logoY, 
                                logoWidth, 
                                logoHeight, 
                                {url: treatmentPlanData.clinic.website}
                            );
                        }
                    }
                }
            }).catch(err => {
                console.warn("Logo loading failed:", err);
                // Continue without logo
            });

            // <><>><><>><>><><><><><>>><><<><><><><>
            // Page Numbers
            if (pagesCount > 1) {
                let n = 0;
                doc.setFontSize(fontSizes.SmallFontSize);

                while (n < pagesCount) {
                    n++;
                    doc.setPage(n);
                    doc.text(n + ' / ' + pagesCount, pageCenterX, pageHeight - 20, {align: 'center'});
                }
            }

            // <><>><><>><>><><><><><>>><><<><><><><>
            // PRINT
            // <><>><><>><>><><><><><>>><><<><><><><>

            // Wait for logo to load, then output PDF
            Promise.all([logoLoaded]).then(() => {
                // Open PDF in new window for preview
                doc.output('dataurlnewwindow', { filename: 'plan-tratament.pdf' });
            }).catch(() => {
                // If logo fails, still output the PDF
                doc.output('dataurlnewwindow', { filename: 'plan-tratament.pdf' });
            });

        } catch (err) {
            console.error("Error generating treatment plan PDF:", err);
            // Still try to output the PDF even if there were errors
            doc.output('dataurlnewwindow', { filename: 'plan-tratament.pdf' });
        }
    })();
}
