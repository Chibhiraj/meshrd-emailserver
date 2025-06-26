const express = require('express');
const cors = require('cors');
const Mailgun = require('mailgun.js');
const formData = require('form-data');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Mailgun
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: '2423c11de6105483992a92a03a3ba170-a1dad75f-603385aa',  // ✅ Move key to .env
  url: 'https://api.mailgun.net',
});

// Email sending endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    // Validation
    if (!name || !email || !phone || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be exactly 10 digits'
      });
    }

    const messageData = {
      from: process.env.MAILGUN_FROM_EMAIL || 'noreply@meshrdtechnologies.com',
      to: process.env.MAILGUN_TO_EMAIL || 'meshrd-official@meshrd.com',
      subject: `New Contact Form Submission from ${name}`,
      text: `
        Name: ${name}
        Email: ${email}
        Phone: ${phone}
        Message: ${message}
      `,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Message:</strong><br>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><em>This message was sent from the contact form on your website.</em></p>
      `
    };

    const response = await mg.messages.create(
      process.env.MAILGUN_DOMAIN || "sandbox4a598964044d4be79c3f89e41a918739.mailgun.org",
      messageData
    );

    res.json({
      success: true,
      message: 'Email sent successfully',
      id: response.id
    });

  } catch (error) {
    console.error('Email sending error:', {
      message: error.message,
      stack: error.stack,
      ...(error.response?.body && { responseBody: error.response.body })
    });

    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
