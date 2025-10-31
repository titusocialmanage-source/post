// script.js - handles UI interactions, fetch to /api/movie and /api/send
document.addEventListener('DOMContentLoaded', () => {
  const searchQuery = document.getElementById('searchQuery');
  const searchType = document.getElementById('searchType');
  const fetchBtn = document.getElementById('fetchBtn');

  const title = document.getElementById('title');
  const tagline = document.getElementById('tagline');
  const overview = document.getElementById('overview');
  const release_date = document.getElementById('release_date');
  const runtime = document.getElementById('runtime');
  const rating = document.getElementById('rating');
  const language = document.getElementById('language');
  const companies = document.getElementById('companies');
  const genres = document.getElementById('genres');
  const directors = document.getElementById('directors');
  const writers = document.getElementById('writers');
  const cast = document.getElementById('cast');
  const trailer = document.getElementById('trailer');

  const downloadContainer = document.getElementById('downloadContainer');
  const addDownloadBtn = document.getElementById('addDownload');

  const generateBtn = document.getElementById('generateBtn');
  const sendBtn = document.getElementById('sendBtn');
  const copyBtn = document.getElementById('copyBtn');
  const codeBox = document.getElementById('codeBox');

  // Utility to add a download row
  function addDownloadRow(label = '', url = '') {
    const div = document.createElement('div');
    div.className = 'download-row';
    div.innerHTML = `
      <input class="dl-label" placeholder="Button Text" value="${escapeHtmlAttr(label)}" />
      <input class="dl-url" placeholder="Button URL" value="${escapeHtmlAttr(url)}" />
      <button class="remove-dl" title="Remove">✖</button>
    `;
    downloadContainer.appendChild(div);

    div.querySelector('.remove-dl').addEventListener('click', () => div.remove());
  }

  // Initial one download row
  addDownloadRow();

  addDownloadBtn.addEventListener('click', (e) => {
    e.preventDefault();
    addDownloadRow();
  });

  fetchBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const q = searchQuery.value.trim();
    const t = searchType.value;
    if (!q) return alert('Please enter a movie or TV name.');

    fetchBtn.disabled = true;
    fetchBtn.textContent = 'Fetching...';

    try {
      const resp = await fetch('/api/movie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, type: t })
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Failed to fetch');
      }
      const data = await resp.json();
      // auto-fill fields (editable)
      title.value = data.title || '';
      tagline.value = data.tagline || '';
      overview.value = data.overview || '';
      release_date.value = data.release_date || '';
      runtime.value = data.runtime || '';
      rating.value = data.rating || '';
      language.value = data.language || '';
      companies.value = (data.production_companies || []).map(c => c.name).join(', ');
      genres.value = (data.genres || []).map(g => g.name).join(', ');
      directors.value = (data.crew_summary && data.crew_summary.directors) ? data.crew_summary.directors.join(', ') : '';
      writers.value = (data.crew_summary && data.crew_summary.writers) ? data.crew_summary.writers.join(', ') : '';
      cast.value = (data.cast || []).map(c => c.name).join(', ');
      trailer.value = data.trailer || '';

      // clear downloads
      downloadContainer.innerHTML = '';
      addDownloadRow();

      alert('Data fetched and form auto-filled. Edit fields as needed.');
    } catch (err) {
      console.error(err);
      alert('Error fetching data: ' + err.message);
    } finally {
      fetchBtn.disabled = false;
      fetchBtn.textContent = 'Fetch & Auto-fill';
    }
  });

  generateBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const html = generateHtml();
    codeBox.textContent = html;
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  });

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(codeBox.textContent);
      alert('HTML copied to clipboard.');
    } catch (err) {
      alert('Failed to copy to clipboard: ' + err.message);
    }
  });

  sendBtn.addEventListener('click', async () => {
    const html = codeBox.textContent || generateHtml();
    if (!html) return alert('Nothing to send. Generate HTML first.');

    const postTitle = title.value || 'Untitled Post';
    // Build labels array from genres field
    const labelsArr = (genres.value || '').split(',').map(s => s.trim()).filter(Boolean);

    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';

    try {
      const resp = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: postTitle,
          html,
          labels: labelsArr
        })
      });
      const result = await resp.json();
      if (!resp.ok) {
        throw new Error(result.error || 'Failed to send');
      }
      alert('Sent successfully. Blogger should receive the post via email (subject = post title).');
    } catch (err) {
      console.error(err);
      alert('Error sending: ' + err.message);
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send to Blogger (via Gmail)';
    }
  });

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

    // download links
    const dls = Array.from(downloadContainer.querySelectorAll('.download-row')).map(r => {
      const lbl = r.querySelector('.dl-label').value.trim();
      const url = r.querySelector('.dl-url').value.trim();
      if (!lbl || !url) return null;
      return { label: lbl, url };
    }).filter(Boolean);

    // Build HTML: bold labels and normal values. Genres shown as Post Labels.
    const lines = [];

    if (gens) {
      // Show Genres as Post Labels as requested
      const labelHtml = `<p><b>Post Labels:</b> ${escapeHtml(gens)}</p>`;
      lines.push(labelHtml);
    }

    if (tl) lines.push(`<p><b>Tagline:</b> ${escapeHtml(tl)}</p>`);
    if (ov) lines.push(`<p><b>Overview:</b> ${escapeHtml(ov)}</p>`);
    if (rd) lines.push(`<p><b>Release Date:</b> ${escapeHtml(rd)}</p>`);
    if (rt) lines.push(`<p><b>Runtime:</b> ${escapeHtml(rt)}</p>`);
    if (rtg) lines.push(`<p><b>Rating:</b> ${escapeHtml(rtg)}</p>`);
    if (lang) lines.push(`<p><b>Language:</b> ${escapeHtml(lang)}</p>`);
    if (comps) lines.push(`<p><b>Production Companies:</b> ${escapeHtml(comps)}</p>`);
    if (dirs) lines.push(`<p><b>Directors:</b> ${escapeHtml(dirs)}</p>`);
    if (wr) lines.push(`<p><b>Writers:</b> ${escapeHtml(wr)}</p>`);
    if (ct) lines.push(`<p><b>Top Cast:</b> ${escapeHtml(ct)}</p>`);
    if (tr) lines.push(`<p><b>Trailer:</b> <a href="${escapeAttr(tr)}" target="_blank">${escapeHtml(tr)}</a></p>`);

    // Downloads as inline buttons
    if (dls.length) {
      const buttons = dls.map(dl => `<a href="${escapeAttr(dl.url)}" style="display:inline-block;margin:6px 8px;padding:8px 12px;background:#2b6cb0;color:#fff;border-radius:6px;text-decoration:none;">${escapeHtml(dl.label)}</a>`).join('');
      lines.push(`<p><b>Download:</b><br/>${buttons}</p>`);
    }

    // Wrap with a main container; title is used as email subject when sending
    const html = `<div>
  <h1>${escapeHtml(postTitle)}</h1>
  ${lines.join('\n  ')}
</div>`;

    return html;
  }

  // small helpers
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