const nodemailer = require("nodemailer");

const Mailer = async (userEmail, message, subject) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_NEW_USER,
      pass: process.env.EMAIL_NEW_PASS,
    },
  });

  const mailOptions = {
    from: "nilaypophalkarvesit@gmail.com",
    to: userEmail,
    subject: subject,
    html: message,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = Mailer;
