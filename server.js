// server.js
import express from "express";
import nodemailer from "nodemailer";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import path from "path";

dotenv.config();
const app = express();
const __dirname = path.resolve();

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); // serve index.html

// ---- Email Sender API ----
app.post("/send_email", async (req, res) => {
  const { title, html, trailer, downloadLinks } = req.body;
  if (!title || !html) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    // configure mail transporter (use Gmail or SMTP service)
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"TMDB Blogger Post Generator" <${process.env.EMAIL_USER}>`,
      to: process.env.RECEIVER_EMAIL || process.env.EMAIL_USER,
      subject: `🎬 New Blogger Post: ${title}`,
      html: `
        <h2>${title}</h2>
        <p><b>Trailer:</b> <a href="${trailer}" target="_blank">${trailer}</a></p>
        <hr>
        ${html}
        <hr>
        <h3>Download Links:</h3>
        <ul>
          ${downloadLinks
            .map(
              (d) => `<li><a href="${d.url}" target="_blank">${d.label}</a></li>`
            )
            .join("")}
        </ul>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully.");
    res.json({ success: true, message: "Email sent successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send email." });
  }
});

// ---- Serve Frontend ----
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
