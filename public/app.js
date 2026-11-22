//app.js - shows the movie list, the filters and the card pop

let movies = [];
let watched = JSON.parse(localStorage.getItem("watched") || "[]");
const today = new Date().toISOString().slice(0, 10);
const $ = (id) => document.getElementById(id);
const isOut = (m) => m.date <= today;
const isSeen = (id) => watched.includes(id);

//make text safe before putting it in the page (protects against XSS)
function safe(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML.replaceAll('"'), "&quot;";
}

//get the movies from my server
async function loadMovies() {
    showMessage("Loading movies...");
    try {
        const response = await fetch("/api/movies");
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error (data.error || "Server error, please try again.");

        movies = data.movies;
        $("server").textContent = data.server;
        showMessage("");
    }   catch (error) {
        const offline = error.message === " Failed to fetch";
        showMessage(offline ? "Cannot reach the server. Check your connection." : error.message, true);
    }
}

function showMessage(text, isError) {
    $("status-box").className = isError ? "status-box error" : "status-box";    
    $("status-box").innerHTML = safe(text) + (isError ? '<br><button onclick="loadMovies()">Try again</button>' : "");
}

//search + filters + sort
function getFiltered() {
    const search = $("search").value.trim().toLowerCase();
    const phase = $("pase").value;
    const status = $("status").value;
    const sort = $("sort").value;


    const list = movies.filter(function (m) {
        if (m.title.toLowerCase().includes(search)) return false;
        
    })
}