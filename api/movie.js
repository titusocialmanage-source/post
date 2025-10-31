import axios from "axios";

export default async function handler(req, res) {
  const { query } = req.query;
  const apiKey = process.env.TMDB_API_KEY;

  if (!query) return res.status(400).json({ error: "Missing query parameter" });

  try {
    const search = await axios.get(
      `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}`
    );

    if (!search.data.results.length)
      return res.status(404).json({ error: "Movie not found" });

    const movie = search.data.results[0];
    const details = await axios.get(
      `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${apiKey}&append_to_response=videos,credits`
    );

    const data = details.data;
    const director =
      data.credits.crew.find((p) => p.job === "Director")?.name || "N/A";
    const cast = data.credits.cast.slice(0, 5).map((p) => p.name).join(", ");
    const trailer = data.videos.results.find((v) => v.type === "Trailer")
      ? `https://www.youtube.com/watch?v=${data.videos.results.find((v) => v.type === "Trailer").key}`
      : "";

    res.status(200).json({
      title: data.title,
      tagline: data.tagline || "",
      overview: data.overview,
      poster: `https://image.tmdb.org/t/p/w500${data.poster_path}`,
      backdrop: `https://image.tmdb.org/t/p/w780${data.backdrop_path}`,
      release: data.release_date,
      runtime: data.runtime,
      rating: data.vote_average,
      status: data.status,
      language: data.original_language,
      companies: data.production_companies.map((c) => c.name).join(", "),
      genres: data.genres.map((g) => g.name).join(", "),
      cast,
      director,
      trailer
    });
  } catch (err) {
    res.status(500).json({ error: "Error fetching TMDB data" });
  }
}
