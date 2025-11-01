const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    if (!TMDB_API_KEY) {
      return res.status(500).json({ error: 'TMDB_API_KEY not configured' });
    }

    const payload = req.method === 'POST' ? req.body : req.query;
    const { query, type } = payload || {};

    if (!query || !type) {
      return res.status(400).json({ error: 'Missing query or type parameter (movie|tv)' });
    }

    const q = encodeURIComponent(query.trim());
    const searchUrl =
      type === 'tv'
        ? `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${q}`
        : `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${q}`;

    const searchResp = await axios.get(searchUrl);
    const results = (searchResp.data && searchResp.data.results) || [];

    if (!results.length) {
      return res.status(404).json({ error: 'No results found for that query' });
    }

    const first = results[0];
    const id = first.id;

    // Request a lot of data to power the richer UI: credits, videos, images, external_ids, recommendations, similar
    const append = 'credits,videos,images,external_ids,recommendations,similar';
    const detailsUrl =
      type === 'tv'
        ? `https://api.themoviedb.org/3/tv/${id}?api_key=${TMDB_API_KEY}&append_to_response=${append}`
        : `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}&append_to_response=${append}`;

    // We also fetch alternative translations optionally for language names, but keep it simple here.
    const detailsResp = await axios.get(detailsUrl);
    const details = detailsResp.data;

    // Normalize fields between movie and tv
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
        (Array.isArray(details.episode_run_time) && details.episode_run_time.length ? details.episode_run_time[0] : ''),
      rating: details.vote_average || null,
      votes: details.vote_count || 0,
      language: details.original_language || '',
      production_companies: details.production_companies || [],
      genres: details.genres || [],
      poster_path: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : null,
      backdrop_path: details.backdrop_path ? `https://image.tmdb.org/t/p/original${details.backdrop_path}` : null,
      homepage: details.homepage || '',
      external_ids: details.external_ids || {},
      credits: details.credits || { cast: [], crew: [] },
      videos: details.videos || { results: [] },
      images: details.images || { backdrops: [], posters: [], stills: [] },
      recommendations: (details.recommendations && details.recommendations.results) || [],
      similar: (details.similar && details.similar.results) || [],
      raw: details
    };

    // Extract trailers (favor YouTube)
    const trailers = (normalized.videos.results || []).filter((v) =>
      v.type && v.type.toLowerCase().includes('trailer')
    );
    const yt = trailers.find((v) => v.site && v.site.toLowerCase().includes('youtube'));
    if (yt) normalized.trailer = `https://www.youtube.com/watch?v=${yt.key}`;
    else if (trailers.length) normalized.trailer = `${trailers[0].site === 'YouTube' ? 'https://www.youtube.com/watch?v=' + trailers[0].key : ''}`;
    else normalized.trailer = '';

    // Cast & crew processing
    normalized.cast = (normalized.credits.cast || []).slice(0, 20).map((c) => ({
      id: c.id,
      name: c.name,
      character: c.character,
      profile_path: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null
    }));

    const crew = normalized.credits.crew || [];
    const directors = crew.filter((c) => c.job && c.job.toLowerCase() === 'director').map((c) => c.name);
    const writers = crew.filter((c) => /writer/i.test(c.job)).map((c) => c.name);
    const producers = crew.filter((c) => /producer/i.test(c.job)).map((c) => c.name);
    const composers = crew.filter((c) => /composer/i.test(c.job)).map((c) => c.name);

    normalized.crew_summary = { directors, writers, producers, composers };

    // Images: merge posters + backdrops and form convenient arrays (limit to top 20)
    const posters = (normalized.images.posters || []).map(p => ({
      path: p.file_path ? `https://image.tmdb.org/t/p/original${p.file_path}` : null,
      width: p.width,
      height: p.height,
      iso_639_1: p.iso_639_1
    }));
    const backdrops = (normalized.images.backdrops || []).map(b => ({
      path: b.file_path ? `https://image.tmdb.org/t/p/original${b.file_path}` : null,
      width: b.width,
      height: b.height,
      iso_639_1: b.iso_639_1
    }));

    normalized.images_list = [...backdrops, ...posters].filter(i => i.path).slice(0, 30);

    // For TV: include seasons and networks if present
    if (type === 'tv') {
      normalized.seasons = details.seasons || [];
      normalized.networks = details.networks || [];
      normalized.created_by = details.created_by || [];
      normalized.episode_run_time = details.episode_run_time || [];
      normalized.last_episode_to_air = details.last_episode_to_air || null;
      normalized.next_episode_to_air = details.next_episode_to_air || null;
    }

    return res.status(200).json(normalized);
  } catch (err) {
    console.error('Error in /api/movie', err && err.response ? err.response.data || err.response.statusText : err.message);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};
