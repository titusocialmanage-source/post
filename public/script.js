document.getElementById("fetchBtn").addEventListener("click", async () => {
  const name = document.getElementById("movieName").value;
  const type = document.getElementById("type").value;
  const res = await fetch(`/api/movie?query=${encodeURIComponent(name)}&type=${type}`);
  const data = await res.json();
  if (data.error) return alert(data.error);
  Object.keys(data).forEach(k => {
    const el = document.getElementById(k);
    if (el) el.value = data[k];
  });
});

document.getElementById("addDownload").addEventListener("click", () => {
  const div = document.createElement("div");
  div.className = "download-pair";
  div.innerHTML = `
    <input class="dl-text" placeholder="Button Text" />
    <input class="dl-url" placeholder="Button URL" />
  `;
  document.getElementById("downloadFields").appendChild(div);
});
document.getElementById("addDownload").click();

document.getElementById("generateBtn").addEventListener("click", generateHTML);
document.getElementById("copyBtn").addEventListener("click", () => {
  navigator.clipboard.writeText(document.getElementById("generatedHtml").innerText);
  alert("HTML code copied!");
});

async function sendToBlogger(html) {
  const title = document.getElementById("title").value;
  const res = await fetch("/api/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html, title })
  });
  const data = await res.json();
  if (data.success) alert("✅ Post sent to Blogger successfully!");
  else alert("❌ Failed to send post");
}

function generateHTML() {
  const fields = ["title","tagline","overview","genres","release","runtime","rating","status","language","poster","backdrop","companies","cast","director","trailer"];
  const data = {};
  fields.forEach(f => data[f] = document.getElementById(f).value);

  const downloadPairs = [...document.querySelectorAll(".download-pair")].map(div => {
    const text = div.querySelector(".dl-text").value;
    const url = div.querySelector(".dl-url").value;
    return text && url
      ? `<a href="${url}" style="display:inline-block;margin:5px;padding:8px 14px;background:#007bff;color:#fff;border-radius:6px;text-decoration:none;">${text}</a>`
      : "";
  }).join("\n");

  const html = `
<div style="border:1px solid #ddd;padding:15px;border-radius:10px;">
  <h2 style="margin-bottom:5px;">${data.title}</h2>
  ${data.tagline ? `<p style="font-style:italic;color:#666;">${data.tagline}</p>` : ""}
  <img src="${data.poster}" alt="${data.title}" style="width:100%;max-width:300px;border-radius:10px;margin:10px 0;" />

  <p><b>Release Date:</b> ${data.release}</p>
  <p><b>Runtime:</b> ${data.runtime} min</p>
  <p><b>Status:</b> ${data.status}</p>
  <p><b>Language:</b> ${data.language}</p>
  <p><b>Rating:</b> ⭐ ${data.rating}</p>
  <p><b>Director / Creator:</b> ${data.director}</p>
  <p><b>Cast:</b> ${data.cast}</p>
  <p><b>Production:</b> ${data.companies}</p>
  <p><b>Overview:</b><br>${data.overview}</p>
  ${data.trailer ? `<p><b>Trailer:</b> <a href="${data.trailer}" target="_blank">Watch on YouTube</a></p>` : ""}
  <div style="margin-top:10px;">${downloadPairs}</div>
  <hr style="margin:15px 0;">
  <p><b>Post Labels:</b> ${data.genres.split(",").map(g => `<a href="#" style="color:#007bff;text-decoration:none;">${g.trim()}</a>`).join(", ")}</p>
</div>`;

  document.getElementById("generatedHtml").innerText = html.trim();
  sendToBlogger(html);
}
