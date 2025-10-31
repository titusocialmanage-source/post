const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    if (!TMDB_API_KEY) {
      return res.status(500).json({ error: 'TMDB_API_KEY not configured' });
    }

    // Accept POST with JSON { query: "...", type: "movie"|"tv" }
    // Or GET with ?query=...&type=...
    const { query, type } = req.method === 'POST' ? req.body : req.query;

    if (!query || !type) {
      return res.status(400).json({ error: 'Missing query or type parameter (movie|tv)' });
    }

    const q = encodeURIComponent(query.trim());
    const searchUrl =
      type === 'tv'
        ? `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${q}`
        : `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${q}`;

    const searchResp = await axios.get(searchUrl);
    const results = searchResp.data && searchResp.data.results ? searchResp.data.results : [];

    if (!results.length) {
      return res.status(404).json({ error: 'No results found for that query' });
    }

    const first = results[0];
    const id = first.id;

    // Fetch details with appended credits and videos
    const append = 'credits,videos,external_ids';
    const detailsUrl =
      type === 'tv'
        ? `https://api.themoviedb.org/3/tv/${id}?api_key=${TMDB_API_KEY}&append_to_response=${append}`
        : `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}&append_to_response=${append}`;

    const detailsResp = await axios.get(detailsUrl);
    const details = detailsResp.data;

    // Normalize some fields between movie and tv
    const normalized = {
      id: details.id,
      type,
      title: details.title || details.name || '',
      original_title: details.original_title || details.original_name || '',
      tagline: details.tagline || '',
      overview: details.overview || '',
      release_date: details.release_date || details.first_air_date || '',
      runtime:
        details.runtime ||
        (Array.isArray(details.episode_run_time) && details.episode_run_time.length ? details.episode_run_time[0] : null),
      rating: details.vote_average || null,
      language: details.original_language || '',
      production_companies: details.production_companies || [],
      genres: details.genres || [],
      poster_path: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : null,
      backdrop_path: details.backdrop_path ? `https://image.tmdb.org/t/p/original${details.backdrop_path}` : null,
      homepage: details.homepage || '',
      external_ids: details.external_ids || {},
      credits: details.credits || { cast: [], crew: [] },
      videos: details.videos || { results: [] },
      raw: details // include raw payload in case frontend needs more
    };

    // Extract main trailer (YouTube)
    const trailers = (normalized.videos.results || []).filter(
      (v) =>
        (v.type && v.type.toLowerCase().includes('trailer')) &&
        (v.site && v.site.toLowerCase().includes('youtube') || v.site.toLowerCase() === 'youtube')
    );
    if (trailers.length) {
      normalized.trailer = `https://www.youtube.com/watch?v=${trailers[0].key}`;
    } else {
      // fallback to any video
      if (normalized.videos.results && normalized.videos.results.length) {
        const v = normalized.videos.results[0];
        normalized.trailer = v.site && v.site.toLowerCase().includes('youtube') ? `https://www.youtube.com/watch?v=${v.key}` : '';
      } else {
        normalized.trailer = '';
      }
    }

    // Limit cast to top 12
    normalized.cast = (normalized.credits.cast || []).slice(0, 12).map((c) => ({
      name: c.name,
      character: c.character,
      profile_path: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null
    }));

    // Helpful crew roles: Director(s), Writer(s), Producer(s)
    const crew = normalized.credits.crew || [];
    const directors = crew.filter((c) => c.job && c.job.toLowerCase() === 'director').map((c) => c.name);
    const writers = crew.filter((c) => /writer/i.test(c.job)).map((c) => c.name);
    const producers = crew.filter((c) => /producer/i.test(c.job)).map((c) => c.name);

    normalized.crew_summary = {
      directors,
      writers,
      producers
    };

    return res.status(200).json(normalized);
  } catch (err) {
    console.error('Error in /api/movie', err && err.response ? err.response.data || err.response.statusText : err.message);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};