const express = require('express');
const cors = require('cors');
const Mailgun = require('mailgun.js');
const formData = require('form-data');
const serverless = require('serverless-http');

require('dotenv').config(); // Optional if using .env locally

const app = express();
app.use(cors());
app.use(express.json());

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: '2423c11de6105483992a92a03a3ba170-a1dad75f-603385aa',  // use environment variable
  url: 'https://api.mailgun.net',
});

app.post('/send-email', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !phone || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Phone number must be exactly 10 digits' });
    }

    const messageData = {
      from: process.env.MAILGUN_FROM_EMAIL || 'noreply@meshrdtechnologies.com',
      to: process.env.MAILGUN_TO_EMAIL || 'meshrd-official@meshrd.com',
      subject: `New Contact Form Submission from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Message:</strong><br>${message.replace(/\n/g, '<br>')}</p>
      `
    };

    const response = await mg.messages.create('sandbox4a598964044d4be79c3f89e41a918739.mailgun.org', messageData);

    res.json({ success: true, message: 'Email sent successfully', id: response.id });

  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ success: false, message: 'Failed to send email', error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

module.exports = serverless(app);
