const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    const { title, html, labels } = req.body || {};
    const GMAIL_USER = process.env.GMAIL_USER;
    const GMAIL_PASS = process.env.GMAIL_PASS;
    const BLOGGER_EMAIL = process.env.BLOGGER_EMAIL;

    if (!GMAIL_USER || !GMAIL_PASS || !BLOGGER_EMAIL) {
      return res.status(500).json({ error: 'GMAIL_USER, GMAIL_PASS and BLOGGER_EMAIL must be configured in environment' });
    }

    if (!title || !html) {
      return res.status(400).json({ error: 'Missing title or html in request body' });
    }

    // Gmail transporter - recommend using App Password if 2FA enabled
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASS
      }
    });

    // Many Blogger setups accept HTML email body as the post content and use the email subject as the title.
    // Some blogger email-to-post addresses accept labels via "Labels: label1,label2" at top of email body.
    // We'll include optional labels header at the top of the html body as a visible line and hidden comment that Blogger may parse.
    const labelsLine = labels && labels.length ? `<p><b>Post Labels:</b> ${labels.join(', ')}</p>` : '';
    const labelsComment = labels && labels.length ? `<!-- Labels: ${labels.join(', ')} -->` : '';

    const mailOptions = {
      from: GMAIL_USER,
      to: BLOGGER_EMAIL,
      subject: title,
      // send as HTML email
      html: `${labelsComment}${labelsLine}${html}`
    };

    const info = await transporter.sendMail(mailOptions);

    return res.status(200).json({ ok: true, info });
  } catch (err) {
    console.error('Error in /api/send', err);
    return res.status(500).json({ error: 'Failed to send email', details: err.message });
  }
};