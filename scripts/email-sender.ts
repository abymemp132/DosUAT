import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function sendEmail() {
  const pdfPath = path.resolve(process.cwd(), 'playwright-report/test-report.pdf');
  const resultsPath = path.resolve(process.cwd(), 'reports/results.json');

  if (!fs.existsSync(pdfPath)) {
    console.error(`❌ PDF Report not found at ${pdfPath}!`);
    process.exit(1);
  }

  // Attempt to parse metrics
  let total = 0, passed = 0, failed = 0, skipped = 0, flaky = 0, durationStr = 'N/A';
  let passRate = '0%';
  
  try {
    if (fs.existsSync(resultsPath)) {
      const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
      if (data.stats) {
        passed = data.stats.expected || 0;
        failed = data.stats.unexpected || 0;
        skipped = data.stats.skipped || 0;
        flaky = data.stats.flaky || 0;
        total = passed + failed + skipped + flaky;
        
        if (total > skipped) {
            passRate = ((passed / (total - skipped)) * 100).toFixed(1) + '%';
        }
        
        const durationSecs = Math.round((data.stats.duration || 0) / 1000);
        const mins = Math.floor(durationSecs / 60);
        const secs = durationSecs % 60;
        durationStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
      }
    }
  } catch(e) {
    console.log("Could not parse results.json metrics, using fallbacks.");
  }

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const emailRecipients = process.env.EMAIL_RECIPIENTS;

  if (!smtpUser || !smtpPass || !emailRecipients) {
    throw new Error("SMTP_USER, SMTP_PASS, and EMAIL_RECIPIENTS must be configured.");
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, 
    auth: {
      user: smtpUser,
      pass: smtpPass, 
    },
  });

  const environment = (process.env.TEST_ENV || 'UAT').toUpperCase();
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; margin: 0; padding: 0; background-color: #f4f7f6; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .header { background: #1e3a8a; color: #ffffff; padding: 20px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 30px; }
        .intro { font-size: 16px; line-height: 1.6; margin-bottom: 25px; color: #555; }
        
        .metrics-grid { display: table; width: 100%; border-collapse: separate; border-spacing: 10px 0; margin-bottom: 25px; }
        .metric-card { display: table-cell; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; text-align: center; width: 33%; }
        .metric-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 5px; font-weight: 700; }
        .metric-value { font-size: 22px; font-weight: bold; color: #0f172a; }
        .value-pass { color: #10b981; }
        .value-fail { color: #ef4444; }
        
        .details-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .details-table th, .details-table td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        .details-table th { background: #f1f5f9; color: #475569; font-weight: 600; font-size: 14px; width: 40%; }
        .details-table td { font-size: 14px; color: #1e293b; font-weight: 500; }
        
        .footer { background: #f8fafc; padding: 20px 30px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        .highlight { color: #1e3a8a; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Automated Test Execution Report</h1>
        </div>
        <div class="content">
          <p class="intro">
            Hello Team,<br><br>
            The automated test suite execution has successfully concluded for the <span class="highlight">${environment}</span> environment. 
            Please review the high-level metrics below. A comprehensive, detailed PDF report is attached to this email.
          </p>
          
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-title">Pass Rate</div>
              <div class="metric-value value-pass">${passRate}</div>
            </div>
            <div class="metric-card">
              <div class="metric-title">Failed</div>
              <div class="metric-value ${failed > 0 ? 'value-fail' : ''}">${failed}</div>
            </div>
            <div class="metric-card">
              <div class="metric-title">Duration</div>
              <div class="metric-value">${durationStr}</div>
            </div>
          </div>
          
          <table class="details-table">
            <tr>
              <th>Project Name</th>
              <td>DosUAT Automation</td>
            </tr>
            <tr>
              <th>Target Environment</th>
              <td>${environment}</td>
            </tr>
            <tr>
              <th>Total Tests Executed</th>
              <td>${total}</td>
            </tr>
            <tr>
              <th>Execution Date</th>
              <td>${new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</td>
            </tr>
          </table>
          
          <p class="intro" style="font-size: 14px;">
            <em>Note: The attached PDF contains complete diagnostic logs, visual proof of execution, and step-by-step traces for any failures.</em>
          </p>
        </div>
        <div class="footer">
          Generated automatically by Jenkins CI/CD Pipeline &bull; Playwright Automation Framework
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"DosUAT QA Automation" <${smtpUser}>`,
    to: emailRecipients,
    subject: `QA Test Execution Report - ${environment}`,
    html: htmlContent,
    attachments: [
      {
        filename: `DosUAT-Test-Report-${new Date().toISOString().split('T')[0]}.pdf`,
        path: pdfPath,
      },
    ],
  };

  console.log('📧 Attempting to send professional HTML report email...');
  const info = await transporter.sendMail(mailOptions);
  console.log('✅ Email sent successfully! Message ID:', info.messageId);
}

sendEmail().catch(err => {
  console.error('❌ Error sending email:', err);
  process.exit(1);
});
