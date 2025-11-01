// Enhanced script: richer preview, screenshot selection, inline-CSS HTML generator
document.addEventListener('DOMContentLoaded', () => {
  const el = id => document.getElementById(id);

  const searchQuery = el('searchQuery');
  const searchType = el('searchType');
  const fetchBtn = el('fetchBtn');

  const title = el('title');
  const tagline = el('tagline');
  const overview = el('overview');
  const release_date = el('release_date');
  const runtime = el('runtime');
  const rating = el('rating');
  const language = el('language');
  const companies = el('companies');
  const genres = el('genres');
  const directors = el('directors');
  const writers = el('writers');
  const cast = el('cast');
  const trailer = el('trailer');

  const downloadContainer = el('downloadContainer');
  const addDownloadBtn = el('addDownload');

  const generateBtn = el('generateBtn');
  const sendBtn = el('sendBtn');
  const copyBtn = el('copyBtn');
  const codeBox = el('codeBox');

  const posterImg = el('posterImg');
  const previewTitle = el('previewTitle');
  const previewTagline = el('previewTagline');
  const previewOverview = el('previewOverview');
  const previewRelease = el('previewRelease');
  const previewRuntime = el('previewRuntime');
  const previewRating = el('previewRating');
  const previewGenres = el('previewGenres');
  const previewTrailer = el('previewTrailer');
  const previewHomepage = el('previewHomepage');

  const screenshots = el('screenshots');

  // Download rows
  function addDownloadRow(label='', url='') {
    const div = document.createElement('div');
    div.className = 'dl-row';
    div.style.display = 'flex';
    div.style.gap = '8px';
    div.style.marginBottom = '8px';
    div.innerHTML = `
      <input class="dl-label" placeholder="Button Text" value="${escapeHtmlAttr(label)}" />
      <input class="dl-url" placeholder="Button URL" value="${escapeHtmlAttr(url)}" style="flex:1" />
      <button class="remove-dl btn small">✖</button>
    `;
    downloadContainer.appendChild(div);
    div.querySelector('.remove-dl').addEventListener('click', () => div.remove());
  }
  addDownloadRow();

  addDownloadBtn.addEventListener('click', (e) => {
    e.preventDefault(); addDownloadRow();
  });

  // Fetch from our /api/movie endpoint
  fetchBtn.addEventListener('click', async () => {
    const q = searchQuery.value.trim();
    const t = searchType.value;
    if (!q) return alert('Enter a title to search');

    fetchBtn.disabled = true; fetchBtn.textContent = 'Fetching...';
    try {
      const resp = await fetch('/api/movie', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ query: q, type: t })
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Failed to fetch');
      }
      const data = await resp.json();
      populateForm(data);
      renderPreview(data);
      renderScreenshots(data.images_list || []);
      alert('Fetched details — you may edit fields before generating.');
    } catch (err) {
      console.error(err); alert('Error: ' + err.message);
    } finally {
      fetchBtn.disabled = false; fetchBtn.textContent = 'Fetch';
    }
  });

  // Populate form fields with fetched data
  function populateForm(d) {
    title.value = d.title || '';
    tagline.value = d.tagline || '';
    overview.value = d.overview || '';
    release_date.value = d.release_date || '';
    runtime.value = d.runtime || '';
    rating.value = d.rating || '';
    language.value = d.language || '';
    companies.value = (d.production_companies || []).map(c=>c.name).join(', ');
    genres.value = (d.genres || []).map(g=>g.name).join(', ');
    directors.value = (d.crew_summary && d.crew_summary.directors) ? d.crew_summary.directors.join(', ') : '';
    writers.value = (d.crew_summary && d.crew_summary.writers) ? d.crew_summary.writers.join(', ') : '';
    cast.value = (d.cast || []).slice(0,12).map(c=>c.name).join(', ');
    trailer.value = d.trailer || '';
    // clear downloads
    downloadContainer.innerHTML = '';
    addDownloadRow();
  }

  // Render the right-side preview
  function renderPreview(data) {
    posterImg.src = data.poster_path || '';
    previewTitle.textContent = data.title || '';
    previewTagline.textContent = data.tagline || '';
    previewOverview.textContent = data.overview || '';
    previewRelease.textContent = data.release_date || '';
    previewRuntime.textContent = data.runtime || '';
    previewRating.textContent = (data.rating ? `${data.rating} / 10 (${data.votes || 0})` : '—');
    previewGenres.innerHTML = '';
    (data.genres || []).forEach(g => {
      const span = document.createElement('span');
      span.className = 'tag'; span.textContent = g.name;
      previewGenres.appendChild(span);
    });
    previewTrailer.href = data.trailer || '#';
    previewHomepage.href = data.homepage || '#';
  }

  // Render screenshot thumbnails
  function renderScreenshots(images) {
    screenshots.innerHTML = '';
    if (!images || !images.length) {
      screenshots.innerHTML = '<p class="muted">No images available.</p>';
      return;
    }
    images.forEach((img, idx) => {
      const thumb = document.createElement('div');
      thumb.className = 'thumb';
      thumb.dataset.src = img.path;
      thumb.title = `Image ${idx+1}`;
      thumb.innerHTML = `<img src="${img.path}" alt="screenshot-${idx}" loading="lazy" />`;
      thumb.addEventListener('click', () => {
        thumb.classList.toggle('selected');
      });
      screenshots.appendChild(thumb);
    });
  }

  // Generate HTML with inline CSS
  generateBtn.addEventListener('click', () => {
    const html = generateHtml();
    codeBox.textContent = html;
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  });

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(codeBox.textContent);
      alert('HTML copied to clipboard');
    } catch (err) {
      alert('Copy failed: ' + err.message);
    }
  });

  // Send to /api/send
  sendBtn.addEventListener('click', async () => {
    const html = codeBox.textContent || generateHtml();
    if (!html) return alert('Generate HTML first.');
    const postTitle = title.value || 'Untitled';
    const labelsArr = (genres.value || '').split(',').map(s=>s.trim()).filter(Boolean);

    sendBtn.disabled = true; sendBtn.textContent = 'Sending...';
    try {
      const resp = await fetch('/api/send', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ title: postTitle, html, labels: labelsArr })
      });
      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error || 'Failed to send');
      alert('Sent — Blogger should receive the email.');
    } catch (err) {
      console.error(err); alert('Send failed: ' + err.message);
    } finally {
      sendBtn.disabled = false; sendBtn.textContent = 'Send to Blogger';
    }
  });

  // Build the final HTML with inline CSS and selected screenshots
  function generateHtml() {
    const postTitle = title.value || '';
    const tl = tagline.value || '';
    const ov = overview.value || '';
    const rd = release_date.value || '';
    const rt = runtime.value || '';
    const rtg = rating.value || '';
    const lang = language.value || '';
    const comps = companies.value || '';
    const gens = genres.value || '';
    const dirs = directors.value || '';
    const wr = writers.value || '';
    const ct = cast.value || '';
    const tr = trailer.value || '';

    const dls = Array.from(downloadContainer.querySelectorAll('.dl-row')).map(r => {
      const lbl = r.querySelector('.dl-label').value.trim();
      const url = r.querySelector('.dl-url').value.trim();
      if (!lbl || !url) return null;
      return { label: lbl, url };
    }).filter(Boolean);

    const selectedImages = Array.from(screenshots.querySelectorAll('.thumb.selected')).map(t => t.dataset.src);

    // Inline CSS (simple, clean, self-contained)
    const inlineCss = `
<style>
  .post-wrap{font-family: Arial, Helvetica, sans-serif; color:#0b1220; line-height:1.45; padding:18px;}
  .post-header{display:flex;gap:18px;align-items:flex-start}
  .post-poster{width:220px;flex:0 0 220px}
  .post-poster img{width:220px;border-radius:8px;display:block}
  .post-main{flex:1}
  .post-title{font-size:28px;margin:0 0 6px}
  .post-tagline{color:#444;margin:0 0 12px}
  .post-meta{color:#555;font-size:13px;margin-bottom:12px}
  .genre-labels{margin-bottom:10px}
  .genre-labels .label{display:inline-block;background:#eef2ff;color:#3b2a86;padding:6px 8px;border-radius:8px;margin-right:6px;font-size:12px}
  .overview{margin:12px 0;color:#222}
  .download-buttons a{display:inline-block;background:#1f6feb;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none;margin:6px 6px 6px 0}
  .screenshot-gallery{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
  .screenshot-gallery img{width:320px;border-radius:8px;display:block}
  .trailer-link{display:inline-block;margin-top:10px;color:#0b5ed7;text-decoration:none}
</style>`.trim();

    const lines = [];
    if (gens) lines.push(`<div class="genre-labels"><b>Post Labels:</b> ${(gens.split(',').map(s=>s.trim()).filter(Boolean).map(s => `<span class="label">${escapeHtml(s)}</span>`).join(' '))}</div>`);
    if (tl) lines.push(`<p class="post-tagline">${escapeHtml(tl)}</p>`);
    if (ov) lines.push(`<div class="overview">${escapeHtml(ov)}</div>`);
    const metaParts = [];
    if (rd) metaParts.push(`<b>Release:</b> ${escapeHtml(rd)}`);
    if (rt) metaParts.push(`<b>Runtime:</b> ${escapeHtml(rt)}`);
    if (rtg) metaParts.push(`<b>Rating:</b> ${escapeHtml(rtg)}`);
    if (metaParts.length) lines.push(`<div class="post-meta">${metaParts.join(' • ')}</div>`);
    if (dirs) lines.push(`<p><b>Director(s):</b> ${escapeHtml(dirs)}</p>`);
    if (wr) lines.push(`<p><b>Writer(s):</b> ${escapeHtml(wr)}</p>`);
    if (ct) lines.push(`<p><b>Cast:</b> ${escapeHtml(ct)}</p>`);
    if (comps) lines.push(`<p><b>Production:</b> ${escapeHtml(comps)}</p>`);
    if (tr) lines.push(`<p><a class="trailer-link" href="${escapeAttr(tr)}" target="_blank">Watch Trailer</a></p>`);

    if (dls.length) {
      const buttons = dls.map(dl => `<a href="${escapeAttr(dl.url)}" rel="nofollow noopener" target="_blank">${escapeHtml(dl.label)}</a>`).join('');
      lines.push(`<div class="download-buttons"><b>Download:</b><br/>${buttons}</div>`);
    }

    if (selectedImages.length) {
      const imgs = selectedImages.map(src => `<img src="${escapeAttr(src)}" alt="" />`).join('');
      lines.push(`<div class="screenshot-gallery">${imgs}</div>`);
    }

    const html = `${inlineCss}
<div class="post-wrap">
  <div class="post-header">
    <div class="post-poster">${posterImg.src ? `<img src="${escapeAttr(posterImg.src)}" alt="${escapeHtml(postTitle)}" />` : ''}</div>
    <div class="post-main">
      <h1 class="post-title">${escapeHtml(postTitle)}</h1>
      ${lines.join('\n      ')}
    </div>
  </div>
</div>`;

    return html;
  }

  // Helpers
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function escapeAttr(str) {
    if (!str) return '';
    return String(str).replace(/"/g, '&quot;');
  }
  function escapeHtmlAttr(str) {
    if (!str) return '';
    return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
});
