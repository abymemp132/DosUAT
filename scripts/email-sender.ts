import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function sendEmail() {
  const pdfPath = path.resolve(process.cwd(), 'playwright-report/test-report.pdf');

  if (!fs.existsSync(pdfPath)) {
    console.error(`❌ PDF Report not found at ${pdfPath}!`);
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, 
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS, // Use App Password for Gmail
    },
  });

  const mailOptions = {
    from: `"QA Automation" <${process.env.SMTP_USER}>`,
    to: process.env.EMAIL_RECIPIENTS,
    subject: `Playwright Test Report - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
    text: `Automation test execution is complete.\n\nProject: DosUAT\nEnvironment: ${process.env.TEST_ENV || 'Not Specified'}\n\nPlease find the attached PDF report for details.`,
    attachments: [
      {
        filename: `Test-Report-${new Date().toISOString().split('T')[0]}.pdf`,
        path: pdfPath,
      },
    ],
  };

  console.log('📧 Attempting to send report email...');
  const info = await transporter.sendMail(mailOptions);
  console.log('✅ Email sent successfully! Message ID:', info.messageId);
}

if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.warn('⚠️ SMTP credentials not found in environment variables. Skipping email.');
} else {
  sendEmail().catch(err => {
      console.error('❌ Error sending email:', err);
      process.exit(1);
  });
}
