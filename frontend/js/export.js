// MET Institute of Management - Document Export Utilities (PDF & Word DOCX)

const DocumentExporter = {
  // Export any element as a Microsoft Word Document (.doc)
  exportToWord(elementId, filename = "MET_Official_Dossier.doc") {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error("Element not found for Word export:", elementId);
      return;
    }

    const preHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>MET Institute of Management - Official Documentation</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #0b1c30;
            line-height: 1.5;
            padding: 20px;
          }
          .header-title {
            color: #d9252a;
            font-size: 20pt;
            font-weight: bold;
            text-align: center;
          }
          .sub-title {
            font-size: 11pt;
            text-align: center;
            color: #555555;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          th, td {
            border: 1px solid #c7c4d8;
            padding: 8px 12px;
            text-align: left;
            font-size: 10.5pt;
          }
          th {
            background-color: #f1f5f9;
            font-weight: bold;
          }
          .stamp {
            border: 2px dashed #059669;
            padding: 10px;
            color: #059669;
            font-family: monospace;
            font-weight: bold;
            display: inline-block;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
    `;
    const postHtml = "</body></html>";
    const html = preHtml + element.innerHTML + postHtml;

    const blob = new Blob(['\ufeff' + html], {
      type: 'application/msword'
    });

    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    document.body.appendChild(downloadLink);
    downloadLink.href = url;
    downloadLink.download = filename;
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);

    App.showToast(`Exported document as ${filename}`, "success");
  },

  // Export element via browser print to PDF
  exportToPDF(elementId, title = "MET Official Dossier") {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error("Element not found for PDF export:", elementId);
      return;
    }

    const printWindow = window.open('', '_blank', 'width=900,height=750');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700&family=JetBrains+Mono:wght@400;600&display=swap">
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            font-family: 'Inter', -apple-system, sans-serif;
            color: #0b1c30;
            line-height: 1.5;
            background: #ffffff;
            padding: 15px;
            margin: 0;
          }
          .met-red { color: #d9252a; }
          .font-heading { font-family: 'Plus Jakarta Sans', sans-serif; }
          .font-mono { font-family: 'JetBrains Mono', monospace; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0; }
          th, td { border: 1px solid #cbd5e1; padding: 7px 10px; font-size: 11px; }
          th { background: #f8fafc; font-weight: 600; }
          .badge { border: 1px solid #cbd5e1; padding: 2px 6px; font-size: 9px; border-radius: 4px; }
          .official-stamp {
            border: 2px dashed #059669;
            color: #059669;
            padding: 8px 14px;
            font-family: 'JetBrains Mono', monospace;
            font-weight: 700;
            font-size: 11px;
            border-radius: 4px;
            display: inline-block;
            margin-top: 15px;
          }
          .photo-grid { display: flex; gap: 8px; margin: 10px 0; }
          .photo-box { width: 110px; height: 75px; background: #e2e8f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #64748b; }
        </style>
      </head>
      <body>
        ${element.innerHTML}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
    App.showToast(`Prepared print/PDF view for ${title}`, "success");
  }
};
