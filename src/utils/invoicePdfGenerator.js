import { jsPDF } from "jspdf";

const OutputType = {
  Save: "save",
  DataUriString: "datauristring",
  DataUri: "datauri",
  DataUrlNewWindow: "dataurlnewwindow",
  Blob: "blob",
  ArrayBuffer: "arraybuffer",
};

/**
 * Generează un PDF pentru factură folosind template-ul jsPDFInvoiceTemplate
 * @param {Object} invoiceData - Datele facturii
 * @param {Object} locationDetails - Detaliile locației/companiei
 * @param {string} outputType - Tipul de output (default: 'dataurlnewwindow')
 * @returns {Object} - Rezultatul generării PDF
 */
export const generateInvoicePDF = (invoiceData, locationDetails, outputType = OutputType.DataUrlNewWindow) => {
  const { formData, totalWithoutVAT, tax, total } = invoiceData;
  
  console.log('🏢 PDF Generator - Location Details received:', locationDetails);
  console.log('📊 PDF Generator - Invoice Data received:', invoiceData);

  // Pregătește header-ul tabelului
  const tableHeader = [
    { title: "Nr.", style: { width: 10 } },
    { title: "Denumire produs/serviciu", style: { width: 60 } },
    { title: "UM", style: { width: 15 } },
    { title: "Cant.", style: { width: 15 } },
    { title: "Preț unitar (lei)", style: { width: 25 } },
    { title: "Cota TVA", style: { width: 18 } },
    { title: "Valoare fără TVA (lei)", style: { width: 30 } },
    { title: "Valoare TVA (lei)", style: { width: 25 } },
    { title: "Valoare cu TVA (lei)", style: { width: 30 } }
  ];

  // Pregătește datele tabelului
  const tableData = formData.items.map((item, index) => {
    const itemTotalWithVAT = (item.price || 0) * (item.quantity || 0);
    const itemVATRate = item.vatRate || 0.19;
    const itemTotalWithoutVAT = itemTotalWithVAT / (1 + itemVATRate);
    const itemVAT = itemTotalWithVAT - itemTotalWithoutVAT;

    return [
      (index + 1).toString(),
      item.description || '',
      item.unit || 'buc',
      (item.quantity || 0).toString(),
      (item.price || 0).toFixed(2),
      `${(itemVATRate * 100).toFixed(0)}%`,
      itemTotalWithoutVAT.toFixed(2),
      itemVAT.toFixed(2),
      itemTotalWithVAT.toFixed(2)
    ];
  });

  // Pregătește rândurile adiționale (totaluri)
  const additionalRows = [
    {
      col1: "Total fără TVA:",
      col2: "",
      col3: `${totalWithoutVAT.toFixed(2)} RON`,
      style: { fontSize: 10 }
    },
    {
      col1: "Total TVA:",
      col2: "",
      col3: `${tax.toFixed(2)} RON`,
      style: { fontSize: 10 }
    },
    {
      col1: "TOTAL DE PLATĂ:",
      col2: "",
      col3: `${total.toFixed(2)} RON`,
      style: { fontSize: 14 }
    }
  ];

  // Configurează datele pentru template
  const businessData = {
    name: locationDetails?.companyName || locationDetails?.name || "Compania Mea SRL",
    address: locationDetails?.address || "",
    phone: locationDetails?.phone || "",
    email: locationDetails?.email || "",
    email_1: locationDetails?.cif ? `CIF: ${locationDetails.cif}` : "",
    website: locationDetails?.iban && locationDetails?.banca 
      ? `${locationDetails.banca} - IBAN: ${locationDetails.iban}` 
      : locationDetails?.iban 
        ? `IBAN: ${locationDetails.iban}`
        : ""
  };
  
  console.log('🏪 PDF Generator - Business Data mapped:', businessData);
  
  const pdfConfig = {
    outputType: outputType,
    returnJsPDFDocObject: false,
    fileName: `Factura_${invoiceData.invoiceNumber || 'draft'}.pdf`,
    orientationLandscape: true,
    compress: true,
    
    business: businessData,
    
    contact: {
      label: "Facturat către:",
      name: formData.client?.clientName || "Client",
      address: formData.client?.clientAddress || "",
      phone: formData.client?.clientPhone || "",
      email: formData.client?.clientEmail || "",
      otherInfo: formData.client?.clientCUI 
        ? `CIF: ${formData.client.clientCUI}` 
        : formData.client?.clientCNP 
          ? `CNP: ${formData.client.clientCNP}` 
          : ""
    },
    
    invoice: {
      label: "Factură nr: ",
      num: invoiceData.invoiceNumber || "DRAFT",
      invDate: `Data emiterii: ${formData.issueDate}`,
      invGenDate: `Data scadenței: ${formData.dueDate}`,
      headerBorder: true,
      tableBodyBorder: true,
      header: tableHeader,
      table: tableData,
      invDescLabel: "Notițe:",
      invDesc: formData.notes || "Mulțumim pentru colaborare!",
      additionalRows: additionalRows
    },
    
    footer: {
      text: "Factură generată electronic"
    },
    
    pageEnable: true,
    pageLabel: "Pagina "
  };

  // Generează PDF-ul
  return jsPDFInvoiceTemplate(pdfConfig);
};

export { OutputType };

/**
 * Template jsPDF pentru generarea facturilor
 */
function jsPDFInvoiceTemplate(props) {
  const param = {
    outputType: props.outputType || "save",
    onJsPDFDocCreation: props.onJsPDFDocCreation || null,
    returnJsPDFDocObject: props.returnJsPDFDocObject || false,
    fileName: props.fileName || "",
    orientationLandscape: props.orientationLandscape || false,
    compress: props.compress || false,
    logo: {
      src: props.logo?.src || "",
      type: props.logo?.type || "",
      width: props.logo?.width || "",
      height: props.logo?.height || "",
      margin: {
        top: props.logo?.margin?.top || 0,
        left: props.logo?.margin?.left || 0,
      },
    },
    stamp: {
      inAllPages: props.stamp?.inAllPages || false,
      src: props.stamp?.src || "",
      width: props.stamp?.width || "",
      height: props.stamp?.height || "",
      margin: {
        top: props.stamp?.margin?.top || 0,
        left: props.stamp?.margin?.left || 0,
      },
    },
    business: {
      name: props.business?.name || "",
      address: props.business?.address || "",
      phone: props.business?.phone || "",
      email: props.business?.email || "",
      email_1: props.business?.email_1 || "",
      website: props.business?.website || "",
    },
    contact: {
      label: props.contact?.label || "",
      name: props.contact?.name || "",
      address: props.contact?.address || "",
      phone: props.contact?.phone || "",
      email: props.contact?.email || "",
      otherInfo: props.contact?.otherInfo || "",
    },
    invoice: {
      label: props.invoice?.label || "",
      num: props.invoice?.num || "",
      invDate: props.invoice?.invDate || "",
      invGenDate: props.invoice?.invGenDate || "",
      headerBorder: props.invoice?.headerBorder || false,
      tableBodyBorder: props.invoice?.tableBodyBorder || false,
      header: props.invoice?.header || [],
      table: props.invoice?.table || [],
      invDescLabel: props.invoice?.invDescLabel || "",
      invDesc: props.invoice?.invDesc || "",
      additionalRows: props.invoice?.additionalRows?.map(x => {
        return {
          col1: x?.col1 || "",
          col2: x?.col2 || "",
          col3: x?.col3 || "",
          style: {
            fontSize: x?.style?.fontSize || 12,
          }
        }
      })
    },
    footer: {
      text: props.footer?.text || "",
    },
    pageEnable: props.pageEnable || false,
    pageLabel: props.pageLabel || "Page",
  };

  const splitTextAndGetHeight = (text, size) => {
    var lines = doc.splitTextToSize(text, size);
    return {
      text: lines,
      height: doc.getTextDimensions(lines).h,
    };
  };
  
  if (param.invoice.table && param.invoice.table.length) {
    if (param.invoice.table[0].length != param.invoice.header.length)
      throw Error("Length of header and table column must be equal.");
  }

  const options = {
    orientation: param.orientationLandscape ? "landscape" : "",
    compress: param.compress
  };

  var doc = new jsPDF(options);
  props.onJsPDFDocCreation && props.onJsPDFDocCreation(doc);
  
  var docWidth = doc.internal.pageSize.width;
  var docHeight = doc.internal.pageSize.height;

  var colorBlack = "#000000";
  var colorGray = "#4d4e53";
  var currentHeight = 15;

  var pdfConfig = {
    headerTextSize: 20,
    labelTextSize: 12,
    fieldTextSize: 10,
    lineHeight: 6,
    subLineHeight: 4,
  };

  doc.setFontSize(pdfConfig.headerTextSize);
  doc.setTextColor(colorBlack);
  doc.text(docWidth - 10, currentHeight, param.business.name, "right");
  doc.setFontSize(pdfConfig.fieldTextSize);

  if (param.logo.src) {
    var imageHeader = '';
    if (typeof window === "undefined") {
      imageHeader = param.logo.src;
    } else {
      imageHeader = new Image();
      imageHeader.src = param.logo.src;
    }
    
    if (param.logo.type)
      doc.addImage(
        imageHeader,
        param.logo.type,
        10 + param.logo.margin.left,
        currentHeight - 5 + param.logo.margin.top,
        param.logo.width,
        param.logo.height
      );
    else
      doc.addImage(
        imageHeader,
        10 + param.logo.margin.left,
        currentHeight - 5 + param.logo.margin.top,
        param.logo.width,
        param.logo.height
      );
  }

  doc.setTextColor(colorGray);

  currentHeight += pdfConfig.subLineHeight;
  currentHeight += pdfConfig.subLineHeight;
  doc.text(docWidth - 10, currentHeight, param.business.address, "right");
  currentHeight += pdfConfig.subLineHeight;
  doc.text(docWidth - 10, currentHeight, param.business.phone, "right");
  doc.setFontSize(pdfConfig.fieldTextSize);
  currentHeight += pdfConfig.subLineHeight;
  doc.text(docWidth - 10, currentHeight, param.business.email, "right");

  currentHeight += pdfConfig.subLineHeight;
  doc.text(docWidth - 10, currentHeight, param.business.email_1, "right");

  currentHeight += pdfConfig.subLineHeight;
  doc.text(docWidth - 10, currentHeight, param.business.website, "right");

  if (param.invoice.header.length) {
    currentHeight += pdfConfig.subLineHeight;
    doc.line(10, currentHeight, docWidth - 10, currentHeight);
  }

  // Contact part
  doc.setTextColor(colorGray);
  doc.setFontSize(pdfConfig.fieldTextSize);
  currentHeight += pdfConfig.lineHeight;
  if (param.contact.label) {
    doc.text(10, currentHeight, param.contact.label);
    currentHeight += pdfConfig.lineHeight;
  }

  doc.setTextColor(colorBlack);
  doc.setFontSize(pdfConfig.headerTextSize - 5);
  if (param.contact.name) doc.text(10, currentHeight, param.contact.name);

  if (param.invoice.label && param.invoice.num) {
    doc.text(
      docWidth - 10,
      currentHeight,
      param.invoice.label + param.invoice.num,
      "right"
    );
  }

  if (param.contact.name || (param.invoice.label && param.invoice.num))
    currentHeight += pdfConfig.subLineHeight;

  doc.setTextColor(colorGray);
  doc.setFontSize(pdfConfig.fieldTextSize - 2);

  if (param.contact.address || param.invoice.invDate) {
    doc.text(10, currentHeight, param.contact.address);
    doc.text(docWidth - 10, currentHeight, param.invoice.invDate, "right");
    currentHeight += pdfConfig.subLineHeight;
  }

  if (param.contact.phone || param.invoice.invGenDate) {
    doc.text(10, currentHeight, param.contact.phone);
    doc.text(docWidth - 10, currentHeight, param.invoice.invGenDate, "right");
    currentHeight += pdfConfig.subLineHeight;
  }

  if (param.contact.email) {
    doc.text(10, currentHeight, param.contact.email);
    currentHeight += pdfConfig.subLineHeight;
  }

  if (param.contact.otherInfo)
    doc.text(10, currentHeight, param.contact.otherInfo);
  else currentHeight -= pdfConfig.subLineHeight;

  // TABLE PART
  var tdWidth = (doc.getPageWidth() - 20) / param.invoice.header.length;

  if (param.invoice.header.length > 2) {
    const customColumnNo = param.invoice.header.map(x => x?.style?.width || 0).filter(x => x > 0);
    let customWidthOfAllColumns = customColumnNo.reduce((a, b) => a + b, 0);
    tdWidth = (doc.getPageWidth() - 20 - customWidthOfAllColumns) / (param.invoice.header.length - customColumnNo.length);
  }

  var addTableHeaderBorder = () => {
    currentHeight += 2;
    const lineHeight = 7;
    let startWidth = 0;
    for (let i = 0; i < param.invoice.header.length; i++) {
      const currentTdWidth = param.invoice.header[i]?.style?.width || tdWidth;
      if (i === 0) doc.rect(10, currentHeight, currentTdWidth, lineHeight);
      else {
        const previousTdWidth = param.invoice.header[i - 1]?.style?.width || tdWidth;
        const widthToUse = currentTdWidth == previousTdWidth ? currentTdWidth : previousTdWidth;
        startWidth += widthToUse;
        doc.rect(startWidth + 10, currentHeight, currentTdWidth, lineHeight);
      }
    }
    currentHeight -= 2;
  };

  var addTableBodyBorder = (lineHeight) => {
    let startWidth = 0;
    for (let i = 0; i < param.invoice.header.length; i++) {
      const currentTdWidth = param.invoice.header[i]?.style?.width || tdWidth;
      if (i === 0) doc.rect(10, currentHeight, currentTdWidth, lineHeight);
      else {
        const previousTdWidth = param.invoice.header[i - 1]?.style?.width || tdWidth;
        const widthToUse = currentTdWidth == previousTdWidth ? currentTdWidth : previousTdWidth;
        startWidth += widthToUse;
        doc.rect(startWidth + 10, currentHeight, currentTdWidth, lineHeight);
      }
    }
  };

  var addTableHeader = () => {
    if (param.invoice.headerBorder) addTableHeaderBorder();

    currentHeight += pdfConfig.subLineHeight;
    doc.setTextColor(colorBlack);
    doc.setFontSize(pdfConfig.fieldTextSize);
    doc.setDrawColor(colorGray);
    currentHeight += 2;

    let startWidth = 0;
    param.invoice.header.forEach(function (row, index) {
      if (index == 0) doc.text(row.title, 11, currentHeight);
      else {
        const currentTdWidth = row?.style?.width || tdWidth;
        const previousTdWidth = param.invoice.header[index - 1]?.style?.width || tdWidth;
        const widthToUse = currentTdWidth == previousTdWidth ? currentTdWidth : previousTdWidth;
        startWidth += widthToUse;
        doc.text(row.title, startWidth + 11, currentHeight);
      }
    });

    currentHeight += pdfConfig.subLineHeight - 1;
    doc.setTextColor(colorGray);
  };

  addTableHeader();

  // TABLE BODY
  var tableBodyLength = param.invoice.table.length;
  param.invoice.table.forEach(function (row, index) {
    doc.line(10, currentHeight, docWidth - 10, currentHeight);

    var getRowsHeight = function () {
      let rowsHeight = [];
      row.forEach(function (rr, index) {
        const widthToUse = param.invoice.header[index]?.style?.width || tdWidth;
        let item = splitTextAndGetHeight(rr.toString(), widthToUse - 1);
        rowsHeight.push(item.height);
      });
      return rowsHeight;
    };

    var maxHeight = Math.max(...getRowsHeight());

    if (param.invoice.tableBodyBorder) addTableBodyBorder(maxHeight + 1);

    let startWidth = 0;
    row.forEach(function (rr, index) {
      const widthToUse = param.invoice.header[index]?.style?.width || tdWidth;
      let item = splitTextAndGetHeight(rr.toString(), widthToUse - 1);

      if (index == 0) doc.text(item.text, 11, currentHeight + 4);
      else {
        const currentTdWidth = rr?.style?.width || tdWidth;
        const previousTdWidth = param.invoice.header[index - 1]?.style?.width || tdWidth;
        const widthToUse = currentTdWidth == previousTdWidth ? currentTdWidth : previousTdWidth;
        startWidth += widthToUse;
        doc.text(item.text, 11 + startWidth, currentHeight + 4);
      }
    });

    currentHeight += maxHeight - 4;
    currentHeight += 5;

    if (index + 1 < tableBodyLength) currentHeight += maxHeight;

    if (
      param.orientationLandscape &&
      (currentHeight > 185 ||
        (currentHeight > 178 && doc.getNumberOfPages() > 1))
    ) {
      doc.addPage();
      currentHeight = 10;
      if (index + 1 < tableBodyLength) addTableHeader();
    }

    if (
      !param.orientationLandscape &&
      (currentHeight > 265 ||
        (currentHeight > 255 && doc.getNumberOfPages() > 1))
    ) {
      doc.addPage();
      currentHeight = 10;
      if (index + 1 < tableBodyLength) addTableHeader();
    }

    if (index + 1 < tableBodyLength && currentHeight > 30)
      currentHeight -= maxHeight;
  });

  var invDescSize = splitTextAndGetHeight(
    param.invoice.invDesc,
    docWidth / 2
  ).height;

  var checkAndAddPageLandscape = function () {
    if (!param.orientationLandscape && currentHeight + invDescSize > 270) {
      doc.addPage();
      currentHeight = 10;
    }
  }

  var checkAndAddPageNotLandscape = function (heightLimit = 173) {
    if (param.orientationLandscape && currentHeight + invDescSize > heightLimit) {
      doc.addPage();
      currentHeight = 10;
    }
  }
  
  var checkAndAddPage = function () {
    checkAndAddPageNotLandscape();
    checkAndAddPageLandscape();
  }

  var addStamp = () => {
    let _addStampBase = () => {
      var stampImage = '';
      if (typeof window === "undefined") {
        stampImage = param.stamp.src;
      } else {
        stampImage = new Image();
        stampImage.src = param.stamp.src;
      }
      
      if (param.stamp.type)
        doc.addImage(
          stampImage,
          param.stamp.type,
          10 + param.stamp.margin.left,
          docHeight - 22 + param.stamp.margin.top,
          param.stamp.width,
          param.stamp.height
        );
      else
        doc.addImage(
          stampImage,
          10 + param.stamp.margin.left,
          docHeight - 22 + param.stamp.margin.top,
          param.stamp.width,
          param.stamp.height
        );
    };

    if (param.stamp.src) {
      if (param.stamp.inAllPages)
        _addStampBase();
      else if (!param.stamp.inAllPages && doc.getCurrentPageInfo().pageNumber == doc.getNumberOfPages())
        _addStampBase();
    }
  }

  checkAndAddPage();

  doc.setTextColor(colorBlack);
  doc.setFontSize(pdfConfig.labelTextSize);
  currentHeight += pdfConfig.lineHeight;

  // Additional rows
  if (param.invoice.additionalRows?.length > 0) {
    doc.line(docWidth / 2, currentHeight, docWidth - 10, currentHeight);
    currentHeight += pdfConfig.lineHeight;

    for (let i = 0; i < param.invoice.additionalRows.length; i++) {
      currentHeight += pdfConfig.lineHeight;
      doc.setFontSize(param.invoice.additionalRows[i].style.fontSize);

      doc.text(docWidth / 1.5, currentHeight, param.invoice.additionalRows[i].col1, "right");
      doc.text(docWidth - 25, currentHeight, param.invoice.additionalRows[i].col2, "right");
      doc.text(docWidth - 10, currentHeight, param.invoice.additionalRows[i].col3, "right");
      checkAndAddPage();
    }
  }

  checkAndAddPage();

  doc.setTextColor(colorBlack);
  currentHeight += pdfConfig.subLineHeight;
  currentHeight += pdfConfig.subLineHeight;
  doc.setFontSize(pdfConfig.labelTextSize);

  // Add num of pages at the bottom
  if (doc.getNumberOfPages() > 1) {
    for (let i = 1; i <= doc.getNumberOfPages(); i++) {
      doc.setFontSize(pdfConfig.fieldTextSize - 2);
      doc.setTextColor(colorGray);

      if (param.pageEnable) {
        doc.text(docWidth / 2, docHeight - 10, param.footer.text, "center");
        doc.setPage(i);
        doc.text(
          param.pageLabel + " " + i + " / " + doc.getNumberOfPages(),
          docWidth - 20,
          doc.internal.pageSize.height - 6
        );
      }

      checkAndAddPageNotLandscape(183);
      checkAndAddPageLandscape();
      addStamp();
    }
  }

  // INVOICE DESCRIPTION
  var addInvoiceDesc = () => {
    doc.setFontSize(pdfConfig.labelTextSize);
    doc.setTextColor(colorBlack);

    doc.text(param.invoice.invDescLabel, 10, currentHeight);
    currentHeight += pdfConfig.subLineHeight;
    doc.setTextColor(colorGray);
    doc.setFontSize(pdfConfig.fieldTextSize - 1);

    var lines = doc.splitTextToSize(param.invoice.invDesc, docWidth / 2);
    doc.text(lines, 10, currentHeight);
    currentHeight +=
      doc.getTextDimensions(lines).h > 5
        ? doc.getTextDimensions(lines).h + 6
        : pdfConfig.lineHeight;

    return currentHeight;
  };
  
  addInvoiceDesc();
  addStamp();

  // Add num of first page at the bottom
  if (doc.getNumberOfPages() === 1 && param.pageEnable) {
    doc.setFontSize(pdfConfig.fieldTextSize - 2);
    doc.setTextColor(colorGray);
    doc.text(docWidth / 2, docHeight - 10, param.footer.text, "center");
    doc.text(
      param.pageLabel + "1 / 1",
      docWidth - 20,
      doc.internal.pageSize.height - 6
    );
  }

  let returnObj = {
    pagesNumber: doc.getNumberOfPages(),
  };

  if (param.returnJsPDFDocObject) {
    returnObj = {
      ...returnObj,
      jsPDFDocObject: doc,
    };
  }

  if (param.outputType === "save") doc.save(param.fileName);
  else if (param.outputType === "blob") {
    const blobOutput = doc.output("blob");
    returnObj = {
      ...returnObj,
      blob: blobOutput,
    };
  } else if (param.outputType === "datauristring") {
    returnObj = {
      ...returnObj,
      dataUriString: doc.output("datauristring", {
        filename: param.fileName,
      }),
    };
  } else if (param.outputType === "arraybuffer") {
    returnObj = {
      ...returnObj,
      arrayBuffer: doc.output("arraybuffer"),
    };
  } else
    doc.output(param.outputType, {
      filename: param.fileName,
    });

  return returnObj;
}

