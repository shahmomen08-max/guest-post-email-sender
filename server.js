const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// Frontend file serve karne ke liye
app.use(express.static(path.join(__dirname, 'public')));

// Nodemailer transporter setup (Aap yahan apne Gmail accounts ki App Passwords configure karenge)
// Yeh 5 alag accounts ke liye dynamic ho sakta hai
const createTransporter = (userEmail, appPassword) => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: userEmail,
      pass: appPassword
    }
  });
};

// Email sending endpoint
app.post('/api/send-email', async (req, res) => {
  const { senderEmail, appPassword, recipientEmail, clientName, clientNiche, clientWebsite } = req.body;

  if (!senderEmail || !appPassword || !recipientEmail) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const transporter = createTransporter(senderEmail, appPassword);

  const subject = `Quick question about your ${clientNiche} site - ${clientWebsite}`;
  const body = `Hi ${clientName},\n\n` +
               `I was browsing through websites in the ${clientNiche} space and came across ${clientWebsite}. Really liked your content!\n\n` +
               `I am reaching out because I regularly contribute high-quality guest articles to top blogs in this niche. I was wondering if you accept guest posts or sponsored contributions on ${clientWebsite}?\n\n` +
               `I can share a few fresh, well-researched topic ideas if you're open to it. Let me know what you think!\n\n` +
               `Best regards,\nMomen`;

  const mailOptions = {
    from: senderEmail,
    to: recipientEmail,
    subject: subject,
    text: body
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: `Email sent successfully to ${recipientEmail}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.toString() });
  }
});

// Local test ya Vercel export ke liye
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
