import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { html, title } = req.body;

  if (!html || !title) {
    return res.status(400).json({ error: "Missing html or title" });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.BLOGGER_EMAIL,
      subject: title, // ✅ Post title = Movie/TV Show title
      html
    });

    res.status(200).json({ success: true, message: "Post sent to Blogger" });
  } catch (error) {
    console.error("Email Error:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
}
