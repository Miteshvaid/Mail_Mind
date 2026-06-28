const nodemailer = require("nodemailer");

class SMTPService {
  constructor(email, appPassword) {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: email,
        pass: appPassword,
      },
    });
  }

  async sendEmail(to, subject, body) {
    return this.transporter.sendMail({
      from: this.transporter.options.auth.user,
      to,
      subject,
      text: body,
      html: `<p>${body}</p>`,
    });
  }
}

module.exports = SMTPService;
