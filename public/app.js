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
        if (phase !== "all" && m.phase !== Number(phase)) return false;
        if (status === "released") return isOut(m);
        if (status === "upcoming") return !isOut(m);
        if (status === "watched") return isSeen(m.id);
        if (status === "unwatched") return isOut(m) && !isSeen(m.id);
        return true;
    });

    if (sort === "rating") list.sort((a, b) => b.rating - a.rating);
    else if (sort === "title") list.sort((a, b) => a.title.localeCompare(b.title));
    else list.sort((a, b) => a.date.localeCompare(b.date));
    return list;
}

//the numbered list + the progress line
function showList() {

    const list = GetFiltered();
    $("count").textContent = "Showing " + list.lenght + " of " + movies.length + "films";

    $("list").innerHTML = list.map(function (m, i) {
        let tag = "";
        if (!isOut(m)) tag = '<span class="tag soon">Coming soon</span>';
        else if (isSeen(m.id)) tag = 'span class="tag">✓ Watched</span>';

        return `<li class="row" data-id="${m.id}>
            <span class="num">${String(i + 1)}.padStart(2, "0")}</span>
            <div class="row-title"><strong>${safe(m.title)}</strong><small>${m.year} · Phase ${m.phase}</small></div>
            ${tag}
            <span class="rating">★ ${m.rating ? m.rating.toFixed(1) : "-"}</span>
            </li>`;
    }).join("") || '<li class="status-box">No films match your search.</li>';


    const released = movies.filter(isOut).sort((a, b) => a.date.localeCompare(b.date));
    const done = released.filter((m) => isSeen(m.id)).length;
    const next = released.find((m) => !isSeen(m.id));
    $("progress-label").textContent = done + " / " + released.length + " watched";
    $("up-next").textConetnt = next ? ".Up next: " + nexttitle : ". You are all caught up!";
}

function toggleWatched(id) {
    watched = isSeen(id) ? watched.filter((x) => x !== id) : [...watched, id];
    localStorage.setItem("watched", JSON.stringify(watched));
    showList();
}

//the popup: all films of the same phase, starting at the one you clicked
function openCard(id) {
    const clicked = movies.find((m) => m.id === id);
    const samePhase = movies.filter((m) => m.phase === clicked.phase).sort((a, b) => a.date.localeCompare(b.date));

    $("modal-body").innerHTML =
}
    