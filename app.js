const express = require("express");
const axios = require("axios");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB conectado");
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });
    })
    .catch(err => console.error("Error conectando a MongoDB:", err));

// Modelo de usuario
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  favoritos: { type: [Number], default: [] }, // IDs de películas
});
const User = mongoose.model("User", userSchema);

// Middleware de autenticación JWT
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token no proporcionado" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(403).json({ error: "Token inválido" });
  }
};

// 📽️ Obtener 10 películas aleatorias
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
    res.json(response.data.results);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener películas populares" });
  }
});

// 🧾 Detalles de película por ID
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
      imagenes: images.data.backdrops.slice(0, 5),
    });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener detalles de la película" });
  }
});

// 🧍 Registro de usuario
app.post("/api/auth/register", async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashed });
    await newUser.save();
    res.json({ email, password, favoritos: [] });
  } catch {
    res.status(500).json({ error: "Error al registrar usuario" });
  }
});

// 🔐 Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const usuario = await User.findOne({ email });
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

    const valid = await bcrypt.compare(password, usuario.password);
    if (!valid) return res.status(401).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign({ id: usuario._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token, email, favoritos: usuario.favoritos });
  } catch {
    res.status(500).json({ error: "Error en login" });
  }
});

// 🔄 Verificar sesión
app.get("/api/auth/verify", auth, (req, res) => {
  res.json({ loggedIn: true, userId: req.userId });
});

// ➕ Agregar favorito
app.put("/api/user/favoritos", auth, async (req, res) => {
  const { movieId } = req.body;
  try {
    const user = await User.findById(req.userId);
    if (!user.favoritos.includes(movieId)) {
      user.favoritos.push(movieId);
      await user.save();
    }
    res.json({ favoritos: user.favoritos });
  } catch {
    res.status(500).json({ error: "Error al agregar favorito" });
  }
});

// ➖ Eliminar favorito
app.delete("/api/user/favoritos", auth, async (req, res) => {
  const { movieId } = req.body;
  try {
    const user = await User.findById(req.userId);
    user.favoritos = user.favoritos.filter((id) => id !== movieId);
    await user.save();
    res.json({ favoritos: user.favoritos });
  } catch {
    res.status(500).json({ error: "Error al eliminar favorito" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor en ejecución en http://localhost:${PORT}`);
});
