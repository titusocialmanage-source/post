import axios from "axios";

export default async function handler(req, res) {
  const { query, type = "movie" } = req.query;
  const apiKey = process.env.TMDB_API_KEY;

  if (!query) return res.status(400).json({ error: "Missing query parameter" });

  try {
    const search = await axios.get(
      `https://api.themoviedb.org/3/search/${type}?api_key=${apiKey}&query=${encodeURIComponent(query)}`
    );

    if (!search.data.results.length)
      return res.status(404).json({ error: `${type === "tv" ? "TV Show" : "Movie"} not found` });

    const item = search.data.results[0];
    const details = await axios.get(
      `https://api.themoviedb.org/3/${type}/${item.id}?api_key=${apiKey}&append_to_response=videos,credits`
    );

    const data = details.data;
    const director =
      type === "movie"
        ? data.credits.crew.find((p) => p.job === "Director")?.name || "N/A"
        : data.created_by?.map((p) => p.name).join(", ") || "N/A";

    const cast = data.credits.cast.slice(0, 5).map((p) => p.name).join(", ");
    const trailer = data.videos.results.find((v) => v.type === "Trailer")
      ? `https://www.youtube.com/watch?v=${data.videos.results.find((v) => v.type === "Trailer").key}`
      : "";

    res.status(200).json({
      title: data.title || data.name,
      tagline: data.tagline || "",
      overview: data.overview,
      poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : "",
      backdrop: data.backdrop_path ? `https://image.tmdb.org/t/p/w780${data.backdrop_path}` : "",
      release: data.release_date || data.first_air_date || "",
      runtime: data.runtime || (data.episode_run_time ? data.episode_run_time[0] : ""),
      rating: data.vote_average,
      status: data.status,
      language: data.original_language,
      companies: data.production_companies
        ? data.production_companies.map((c) => c.name).join(", ")
        : data.networks?.map((n) => n.name).join(", "),
      genres: data.genres.map((g) => g.name).join(", "),
      cast,
      director,
      trailer
    });
  } catch (err) {
    res.status(500).json({ error: "Error fetching TMDB data" });
  }
}
