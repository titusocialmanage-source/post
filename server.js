import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ POST API to send Blogger post via Gmail
app.post("/send-post", async (req, res) => {
  try {
    const { title, genres, html } = req.body;
    if (!title || !html) return res.status(400).json({ error: "Missing data" });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.RECEIVER_EMAIL,
      subject: title, // 🎬 Movie/TV name as Post Title
      html: `
        <div>
          <p><b>Labels:</b> ${genres}</p>
          <hr/>
          ${html}
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Post sent successfully to Blogger email!" });
  } catch (err) {
    console.error("Error sending email:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
