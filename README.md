# TMDB Post Generator

TMDB Post Generator fetches full Movie or TV show data from TMDB, auto-fills an editable form, lets you add multiple inline download links, generates Blogger-ready HTML, copies it to clipboard, and sends the post to Blogger via Gmail SMTP.

Deploy to Vercel:
1. Create a new project in Vercel and connect this repository (or import).
2. Set Environment Variables in Vercel (Project Settings -> Environment Variables):
   - TMDB_API_KEY
   - GMAIL_USER
   - GMAIL_PASS (use an App Password if your account has 2FA)
   - BLOGGER_EMAIL (your blog's post-by-email address)
3. Deploy. The site serves static files from `/public` and two serverless functions in `/api`.

Local testing:
- Install dependencies: `npm install`
- Test serverless locally with `vercel dev` or set up a small local server that proxies to functions.
- You may create a local `.env` from `.env.example` for local test (not required for Vercel).

Notes:
- The app uses the TMDB Search API to find a matching movie/tv show and then fetches details with credits and videos appended.
- The /api/send route uses Gmail SMTP (nodemailer). Use an App Password if your Gmail account requires 2FA.
- The generated HTML includes a bold label/value structure and a visible "Post Labels" line for genres.