const express = require('express');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Load all 5 accounts dynamically from .env
function getAccounts() {
    let accounts = [];
    let i = 1;
    while (process.env[`EMAIL_USER_${i}`] && process.env[`EMAIL_PASS_${i}`]) {
        accounts.push({
            user: process.env[`EMAIL_USER_${i}`],
            pass: process.env[`EMAIL_PASS_${i}`]
        });
        i++;
    }
    return accounts;
}

let currentAccountIndex = 0;

function getNextTransporter() {
    const accounts = getAccounts();
    if (accounts.length === 0) return null;

    const account = accounts[currentAccountIndex];
    // Rotate to the next account automatically
    currentAccountIndex = (currentAccountIndex + 1) % accounts.length;

    return {
        transporter: nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: account.user,
                pass: account.pass
            }
        }),
        senderEmail: account.user
    };
}

// Bulk Email Sending Endpoint
app.post('/send-bulk-emails', async (req, res) => {
    const { recipients, subjectTemplate, messageTemplate } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ success: false, error: 'Koi recipient list nahi mili!' });
    }

    const accounts = getAccounts();
    if (accounts.length === 0) {
        return res.status(400).json({ success: false, error: 'Koi email account configuration nahi mili .env mein!' });
    }

    let successCount = 0;
    let failCount = 0;

    for (let item of recipients) {
        try {
            const { email, name, website } = item;

            // Personalization dynamic replacement
            let personalizedSubject = subjectTemplate
                .replace(/{name}/g, name || 'there')
                .replace(/{website}/g, website || 'your site');

            let personalizedMessage = messageTemplate
                .replace(/{name}/g, name || 'there')
                .replace(/{website}/g, website || 'your site');

            const accountInfo = getNextTransporter();
            if (!accountInfo) throw new Error('No active email account found');

            let mailOptions = {
                from: accountInfo.senderEmail,
                to: email,
                subject: personalizedSubject,
                text: personalizedMessage
            };

            await accountInfo.transporter.sendMail(mailOptions);
            successCount++;

            // Natural human delay between emails (4 to 8 seconds) to prevent spam flags
            const randomDelay = Math.floor(Math.random() * 4000) + 4000;
            await new Promise(resolve => setTimeout(resolve, randomDelay));

        } catch (err) {
            console.error(`Failed to send to ${item.email}:`, err);
            failCount++;
        }
    }

    res.json({
        success: true,
        message: `Kamyabi se ${successCount} emails bhej di gayi hain! (Fail: ${failCount})`
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Outreach Server running on port ${PORT}`);
});
