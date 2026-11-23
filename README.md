# Multiverse Watch Guide

A web app that helps Marvel fans watch the MCU in order. It lists every Marvel Studios film from the TMDB API, and lets you search, filter by phase or status, sort, mark films as watched and see what to watch next.

- **Live app:** http://18.133.222.158
- **Demo video:** https://youtu.be/YOUR_VIDEO_LINK

## Features

- **Search** by title, **filter** by phase (1–6) or status (released, coming soon, watched, not watched), **sort** by release date, rating or title
- **Film card**: click a film to see its poster, rating and runtime, and scroll through the other films of the same phase
- **Watch tracker**: the ▶ button marks a film as watched (saved in the browser), with a "Mission progress" line and the next film to watch
- **Error handling**: clear messages and a "Try again" button if the server or TMDB is down
- **Security**: the API key stays on the server and is never sent to the browser; all text is escaped to protect against XSS
- **Caching**: the server saves the film list after the first call, so TMDB is called less

Built with Node.js + Express (backend) and HTML, CSS, JavaScript (frontend).

## Run it locally

You need Node.js 18+ and a free [TMDB API key](https://www.themoviedb.org/settings/api).

```bash
git clone https://github.com/fiinsikabore/multiverse-watch-guide.git
cd multiverse-watch-guide
npm install
cp .env.example .env     # then put your TMDB key in .env
npm start
```

Open http://localhost:3000.
On Windows, use `copy` instead of `cp`, and `npm.cmd` instead of `npm` if PowerShell blocks it.

## Deployment

The app runs on **Web01** and **Web02**, and **Lb01** shares the visitors between them.

### On Web01 and Web02 (same steps on both)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx
git clone https://github.com/fiinsikabore/multiverse-watch-guide.git
cd multiverse-watch-guide
npm install --omit=dev
nano .env                          # TMDB_API_KEY=your_key and PORT=3000
sudo npm install -g pm2
pm2 start server.js --name watch-guide
pm2 save && pm2 startup            # keeps the app running after a reboot
```

Nginx sends port 80 to the app. In `/etc/nginx/sites-available/default`:

```nginx
server {
    listen 80 default_server;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
    }
}
```

Then `sudo nginx -t && sudo systemctl restart nginx`.

### On Lb01 (HAProxy)

Added to `/etc/haproxy/haproxy.cfg`:

```
frontend http_front
    bind *:80
    mode http
    default_backend web_servers

backend web_servers
    mode http
    balance roundrobin
    option httpchk GET /health
    server web01 13.40.72.99:80 check
    server web02 18.171.250.120:80 check
```

Then `sudo systemctl restart haproxy`. `roundrobin` sends visitors to Web01 and Web02 in turn, and `/health` lets HAProxy skip a server that is down.

### Testing

```bash
for i in {1..6}; do curl -sI http://18.133.222.158 | grep -i x-served-by; done
```

The answers alternate between `7309-web-01` and `7309-web-02`. The footer of the site also shows which server answered ("Transmission received from base …").

## API used

[TMDB API](https://developer.themoviedb.org/docs) (The Movie Database):

- `GET /discover/movie?with_companies=420&with_keywords=180547`: all MCU films (420 = Marvel Studios, 180547 = "marvel cinematic universe" keyword)
- `GET /movie/{id}`: one film's details, used for the runtime

## Challenges

- **Hiding the API key.** Calling TMDB from the browser would show the key, so I added a small Express server that calls TMDB instead.
- **No "phase" in TMDB.** I work out each film's phase from its release date.
- **Non-MCU films in the results.** Filtering by Marvel Studios also returned old cartoons, so I added the MCU keyword.
- **Windows blocked `npm`.** PowerShell refused to run it, and `npm.cmd` worked instead.

## Credits

- Movie data and posters: [TMDB](https://www.themoviedb.org). *This product uses the TMDB API but is not endorsed or certified by TMDB.*
- [Express](https://expressjs.com/), [dotenv](https://github.com/motdotla/dotenv), [HAProxy](https://www.haproxy.org/), [PM2](https://pm2.keymetrics.io/)
- Fonts: Anton, Kaushan Script and Inter from [Google Fonts](https://fonts.google.com)

Fan project for ALU, not affiliated with Marvel or Disney. By Fiinsi Kabore ([@fiinsikabore](https://github.com/fiinsikabore)).