import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

async function generatePDF() {
  const reportFolder = path.resolve(process.cwd(), 'reports/dashboard-static');
  const indexHtml = path.resolve(reportFolder, 'index.html');
  const pdfPath = path.resolve(process.cwd(), 'playwright-report/test-report.pdf');

  if (!fs.existsSync(indexHtml)) {
    console.error(`❌ HTML report not found at ${indexHtml}. Run tests first.`);
    process.exit(1);
  }

  console.log('🚀 Starting PDF Generation from HTML report...');
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'] // Required for some CI environments
  });
  
  const page = await browser.newPage();
  // Set a large viewport for dashboard layout
  await page.setViewport({ width: 1440, height: 900 });
  
  const fileUrl = `file://${indexHtml}`;
  
  console.log(`📡 Loading Dashboard ${fileUrl}...`);
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });
  
  console.log('🏗️ Triggering Audit Report Generation...');
  // Trigger the dashboard's internal PDF HTML generation
  const pdfHtml = await page.evaluate(() => {
    // Call the function that generates the PDF HTML
    if (typeof (window as any).exportToPdf === 'function') {
        (window as any).exportToPdf();
        // Return the HTML generated for the PDF preview
        return document.getElementById('pdfPreviewContainer')?.innerHTML;
    }
    return null;
  });

  if (!pdfHtml) {
    throw new Error('Could not capture Audit Report HTML from Dashboard.');
  }

  console.log('📄 Rendering high-fidelity Audit Report...');
  // Set the content with a longer timeout and minimal wait
  await page.setContent(pdfHtml, { 
    waitUntil: 'load', 
    timeout: 60000 
  });
  
  // Custom styling to match the dashboard's PDF layout
  await page.addStyleTag({ content: `
    @page { size: letter; margin: 0; }
    body { padding: 0; margin: 0; background: #fff; }
    * { box-sizing: border-box !important; }
  ` });

  await page.pdf({
    path: pdfPath,
    format: 'letter',
    printBackground: true,
    margin: { top: '0', bottom: '0', left: '0', right: '0' }
  });

  await browser.close();
  console.log(`✅ PDF Report successfully generated at: ${pdfPath}`);
}

generatePDF().catch(err => {
    console.error('❌ Error generating PDF:', err);
    process.exit(1);
});
