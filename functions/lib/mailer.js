const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter(user, pass) {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    });
  }
  return transporter;
}

async function sendMail({ user, pass, to, subject, html }) {
  const mailer = getTransporter(user, pass);
  await mailer.sendMail({
    from: `Curriculum Tracker <${user}>`,
    to,
    subject,
    html
  });
}

module.exports = { sendMail };
