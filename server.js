// server.js - gets the MARVEL movies from TMDB and sends them to mt page
require("dotenv").config();
const express = require("express");
const os = require("os");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.TMDB_API_KEY;
const TMDB = "https://api.themoviedb.org/3";

// I save the ;ovie here so I dont call TMDB every time someone opens the page
let savedMovies = null;

//say wich server answered ( to test the load balancer)
app.use(function (req, res, next) {
    res.set("X-Served-By", os.hostname());
    next();
})

// send the files from the public folder (html, css, js)
app.use(express.static("public"));

// TMDB has no "phase", so I find it with the release date
function getPhase(date) {
    if (date < "2012-06-01") return 1;
    if (date < "2015-08-01") return 2;
    if (date < "2019-08-01") return 3;
    if (date < "2023-01-01") return 4;
    if (date < "2025-07-01") return 5;
    return 6;
}

// all Marvel Studio movies (420 is the Marvel studio id on TMDB)
app.get("/api/movies", async function (req, res) {
    if (!API_KEY) {
        return res.status(500).json({error: "The API key is missing. Check the .env file."});
    }

    if (savedMovies) {
        return res.json({ server: os.hostname(), movies: savedMovies });
    }

    try {
        let results = [];
        for (let page = 1; page <= 5; page++) {
            const url = TMDB + "/discover/movie?with_companies=420&sort_by=primary_release_date.asc&page=" + page + "&api_key=" + API_KEY;            
            const response = await fetch(url);
            if (!response.ok) throw new Error("TMDB error " + response.status);
            const data = await response.json();
            results = results.concat(data.results);
            if (page >=data.total_pages) break;
            
        }

        // keep only what my page needs
        savedMovies = [];
        for ( const m of results) {
             if (!m.release_date || m.genre_ids.includes(99)) continue;
            savedMovies.push({
                id: m.id,
                title: m.title,
                date: m.release_date,
                year: m.release_date.slice(0, 4),
                rating: m.vote_average,
                overview: m.overview || "No summary yet.",
                poster: m.poster_path ? "https://image.tmdb.org/t/p/w342" + m.poster_path : null,
                phase: getPhase(m.release_date),
            });
        }

        res.json({server: os.hostname(), movies: savedMovies });
    }   catch (error) {
        console.log(error.message);
        res.status(502).json({ error: "Could not load the movies right now. Please try again." });
    }        
});
// one movie, to get its runtime
app.get("/api/movies/:id", async function (req, res) {
    try {
        const url = TMDB + "/movie/" + Number(req.params.id) + "?api_key=" + API_KEY;
        const response = await fetch(url);
        if (!response.ok) throw new Error("TMDB error " + response.status);

        const data = await response.json();
        res.json({ runtime: data.runtime });
    }   catch (error) {
        res.status(502).json({ error: "Could not load this movie." });
    }
});


// the load balancer checks this to know the server is alive
app.get("/health", function (req, res) {
    res.send("ok");
})

app.listen(PORT, function () {
    console.log("Server running on http://localhost:" + PORT);
});