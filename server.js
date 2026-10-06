const express = require('express');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static('public')); // Agar frontend ek sath ho toh

// Route to handle email sending
app.post('/send-email', async (req, res) => {
    const { recipient, subject, message } = req.body;

    if (!recipient || !subject || !message) {
        return res.status(400).json({ success: false, error: 'Sabhi fields lazmi hain!' });
    }

    try {
        // Configure Nodemailer with Gmail
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        let mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipient,
            subject: subject,
            text: message
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'Email kamiyabi se bhej di gayi hai!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Email bhejne mein koi masla aaya hai.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
