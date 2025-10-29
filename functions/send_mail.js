// functions/send_email.js
import nodemailer from "nodemailer";

export async function onRequestPost(context) {
  const data = await context.request.json();
  const { title, html, trailer, downloadLinks } = data;

  if (!title || !html) {
    return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: context.env.EMAIL_USER,
        pass: context.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"TMDB Blogger Generator" <${context.env.EMAIL_USER}>`,
      to: context.env.RECEIVER_EMAIL || context.env.EMAIL_USER,
      subject: `${title}`,
      html: `
        <h2>${title}</h2>
        <p><b>Trailer:</b> <a href="${trailer}" target="_blank">${trailer}</a></p>
        <hr>${html}<hr>
        <ul>
          ${downloadLinks.map(d => `<li><a href="${d.url}">${d.label}</a></li>`).join("")}
        </ul>
      `,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
