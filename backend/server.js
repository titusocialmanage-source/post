import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// ✅ POST endpoint for Blogger Email Publish
app.post("/send", async (req, res) => {
  const { subject, html, token } = req.body;

  // Token check
  if (token !== process.env.ADMIN_TOKEN)
    return res.status(401).json({ error: "Unauthorized - Invalid Token" });

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.RECEIVER_EMAIL,
      subject: subject || "New TMDB Post",
      html
    });

    console.log("✅ Post sent successfully to Blogger!");
    res.json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("❌ Error sending mail:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ SMTP API running on port ${PORT}`));
