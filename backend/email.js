const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const sentEmailsDir = path.join(__dirname, 'sent_emails');

// Ensure folder exists
if (!fs.existsSync(sentEmailsDir)) {
  fs.mkdirSync(sentEmailsDir, { recursive: true });
}

/**
 * Sends a receipt email. If SMTP is configured, sends a real email.
 * Otherwise, simulates sending by saving the HTML and PDF locally.
 */
async function sendReceiptEmail(reg, eventName, userName, userEmail, pdfBuffer) {
  try {
    const timestamp = Date.now();
    const isSmtpConfigured = !!process.env.SMTP_HOST;
    
    // Choose attachment filename
    const pdfFilename = isSmtpConfigured 
      ? `comprovante-${reg.id}.pdf`
      : `attachment-${reg.id}-${timestamp}.pdf`;

    // Build email HTML template
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #334155;
      background-color: #f1f5f9;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }
    .header {
      background-color: #1a365d;
      color: #ffffff;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 1px;
    }
    .header p {
      margin: 5px 0 0;
      font-size: 14px;
      color: #93c5fd;
    }
    .body {
      padding: 30px 20px;
    }
    .welcome {
      font-size: 18px;
      font-weight: bold;
      color: #1e293b;
      margin-top: 0;
    }
    .details {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
    }
    .details-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 14px;
      border-bottom: 1px solid #f1f5f9;
    }
    .details-row:last-child {
      border-bottom: none;
    }
    .label {
      color: #64748b;
      font-weight: 500;
    }
    .value {
      color: #0f172a;
      font-weight: 700;
    }
    .button-container {
      text-align: center;
      margin: 25px 0;
    }
    .button {
      background-color: #d97706;
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      font-size: 15px;
      font-weight: 600;
      border-radius: 8px;
      display: inline-block;
      box-shadow: 0 4px 6px -1px rgb(217 119 6 / 0.2);
    }
    .footer {
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
    }
    .meta-box {
      background-color: #e2e8f0;
      padding: 10px 15px;
      font-size: 11px;
      font-family: monospace;
      color: #475569;
      border-bottom: 2px solid #cbd5e1;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="meta-box">
      <strong>De:</strong> ${process.env.EMAIL_FROM || 'G-TERCOA Eventos <no-reply@gtercoa.org>'}<br>
      <strong>Para:</strong> ${userName} &lt;${userEmail}&gt;<br>
      <strong>Assunto:</strong> Inscrição Confirmada - ${eventName}<br>
      <strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}<br>
      <strong>Anexo:</strong> <a href="./${pdfFilename}" target="_blank">${pdfFilename}</a>
    </div>

    <div class="header">
      <h1>G-TERCOA</h1>
      <p>Matemática e Pedagogia em Debate</p>
    </div>

    <div class="body">
      <p class="welcome">Olá, ${userName}!</p>
      <p>Sua inscrição para o evento <strong>${eventName}</strong> foi confirmada com sucesso em nosso sistema!</p>
      
      <p>Abaixo estão os detalhes da sua inscrição:</p>
      <div class="details">
        <div class="details-row">
          <span class="label">Código de Inscrição:</span>
          <span class="value">${reg.id}</span>
        </div>
        <div class="details-row">
          <span class="label">Categoria:</span>
          <span class="value">${reg.category}</span>
        </div>
        <div class="details-row">
          <span class="label">Data de Confirmação:</span>
          <span class="value">${new Date(reg.created_at).toLocaleDateString('pt-BR')}</span>
        </div>
      </div>

      <p>Você pode acessar e visualizar o seu comprovante oficial em formato PDF com o QR Code de credenciamento clicando no link do anexo no topo desta mensagem ou no botão abaixo:</p>
      
      <div class="button-container">
        <a href="./${pdfFilename}" class="button" target="_blank">Visualizar Comprovante PDF</a>
      </div>

      <p>Apresente o QR Code deste comprovante no dia do credenciamento presencial ou virtual para validar sua presença.</p>
      <p>Nos vemos lá!</p>
      <p>Atenciosamente,<br><strong>Comissão Organizadora G-TERCOA</strong></p>
    </div>

    <div class="footer">
      Este e-mail é gerado automaticamente. Por favor, não responda diretamente a esta mensagem.<br>
      G-TERCOA &copy; ${new Date().getFullYear()} - Todos os direitos reservados.
    </div>
  </div>
</body>
</html>
    `;

    if (isSmtpConfigured) {
      console.log(`[SMTP Email] Iniciando envio real para ${userEmail} via ${process.env.SMTP_HOST}...`);
      
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const mailOptions = {
        from: process.env.EMAIL_FROM || '"G-TERCOA Eventos" <no-reply@gtercoa.org>',
        to: userEmail,
        subject: `Inscrição Confirmada - ${eventName}`,
        html: emailHtml,
        attachments: [
          {
            filename: pdfFilename,
            content: pdfBuffer
          }
        ]
      };

      await transporter.sendMail(mailOptions);
      console.log(`[SMTP Email] E-mail enviado com sucesso para ${userEmail}.`);
    } else {
      // Local fallback simulation
      const emailFilename = `email-${reg.id}-${timestamp}.html`;
      const pdfPath = path.join(sentEmailsDir, pdfFilename);
      const emailPath = path.join(sentEmailsDir, emailFilename);

      // Save files locally
      fs.writeFileSync(pdfPath, pdfBuffer);
      fs.writeFileSync(emailPath, emailHtml);

      console.log(`[Email Simulation] Fallback ativo. E-mail salvo em: ${emailPath}`);
      console.log(`[Email Simulation] PDF anexo salvo em: ${pdfPath}`);
    }
  } catch (error) {
    console.error('Erro ao enviar ou simular e-mail:', error);
  }
}

module.exports = {
  sendReceiptEmail
};
