const express = require("express");
const axios = require("axios");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

// Obtener 10 películas aleatorias

app.get("/api/movies/random", async (req, res) => {
  try {

    
    const randomPage = Math.floor(Math.random() * 10) + 1;

    const response = await axios.get(
      `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=es-MX&page=${randomPage}`
    );

    const movies = response.data.results;

    const shuffled = movies.sort(() => 0.5 - Math.random()).slice(0, 10);

    const resumen = shuffled.map((movie) => ({
      id: movie.id,
      titulo: movie.title,
      imagen: movie.backdrop_path
        ? `https://image.tmdb.org/t/p/w500${movie.backdrop_path}`
        : null,
    }));

    res.json(resumen);
  } catch (error) {
    console.error("Error en /random:", error.message);
    res.status(500).json({ error: "Error al obtener películas aleatorias" });
  }
});

// 📈 Películas populares
app.get("/api/movies/popular", async (req, res) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=es-MX`
    );
    res.json({
      id: response.data.id,
      titulo: response.data.title,
      imagen: response.data.backdrop_path
      ? `https://image.tmdb.org/t/p/w500${response.data.backdrop_path}`
      : null,
    }
    );
  } catch (err) {
    res.status(500).json({ error: "Error al obtener películas populares" });
  }
});


// 📈 Películas Top rated
app.get("/api/movies/top", async (req, res) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/movie/top-rated?api_key=${API_KEY}&language=es-MX`
    );
    res.json({
      id: response.data.id,
      titulo: response.data.title,
      imagen: response.data.backdrop_path
      ? `https://image.tmdb.org/t/p/w500${response.data.backdrop_path}`
      : null,
    }
    );
  } catch (err) {
    res.status(500).json({ error: "Error al obtener películas populares" });
  }
});

// 📈 Películas Upcoming
app.get("/api/movies/upcoming", async (req, res) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/movie/upcoming?api_key=${API_KEY}&language=es-MX`
    );
    res.json({
      id: response.data.id,
      titulo: response.data.title,
      imagen: response.data.backdrop_path
      ? `https://image.tmdb.org/t/p/w500${response.data.backdrop_path}`
      : null,
    }
    );
  } catch (err) {
    res.status(500).json({ error: "Error al obtener películas populares" });
  }
});

// 📈 Películas Now Playing
app.get("/api/movies/playing", async (req, res) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/movie/now-playing?api_key=${API_KEY}&language=es-MX`
    );
    res.json({
      id: response.data.id,
      titulo: response.data.title,
      imagen: response.data.backdrop_path
      ? `https://image.tmdb.org/t/p/w500${response.data.backdrop_path}`
      : null,
    }
    );
  } catch (err) {
    res.status(500).json({ error: "Error al obtener películas populares" });
  }
});

app.get("/api/movies/:id", async (req, res) => {
  const movieId = req.params.id;

  try {
    const [details, videos, images] = await Promise.all([
      axios.get(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=es-MX`),
      axios.get(`${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}&language=es-MX`),
      axios.get(`${BASE_URL}/movie/${movieId}/images?api_key=${API_KEY}`),
    ]);

    const trailer = videos.data.results.find(
      (v) => v.type === "Trailer" && v.site === "YouTube"
    );

    res.json({
      id: details.data.id,
      titulo: details.data.title,
      puntuacion: details.data.vote_average,
      descripcion: details.data.overview,
      trailer: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
      imagenes: images.data.backdrops.slice(0, 5), // 5 imágenes
    });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener detalles de la película" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor en ejecución en http://localhost:${PORT}`);
});
// si