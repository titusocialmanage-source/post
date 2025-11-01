import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";

const app = express();
app.use(cors());
app.use(express.json());

// 🧠 POST endpoint for Blogger mail publishing
app.post("/send", async (req, res) => {
  const { subject, html, token } = req.body;

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
      to: process.env.RECEIVER_EMAIL, // your Blogger post-by-email
      subject: subject || "New TMDB Post",
      html
    });

    console.log("✅ Email sent successfully!");
    res.json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ SMTP API running on port ${PORT}`));
