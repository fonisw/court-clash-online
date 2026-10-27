# COURT CLASH Online (starter)

This package adds a Node.js + Express + Socket.IO server and a browser client bridge to the V4 HTML game. It supports server-side room creation with 3-character codes/passwords, joining from another device, player state broadcasts, and disconnect notices.

## Run locally
1. Install Node.js 18 or newer.
2. Open a terminal in this folder.
3. Run `npm install`
4. Run `npm start`
5. Open `http://localhost:3000` in two browser windows/devices on the same network.

## Deploy free (Render)
1. Create a GitHub repository and upload the contents of this folder (including `package.json`, `server.js`, and `public/index.html`).
2. In Render choose **New + → Web Service**, connect the repository.
3. Build command: `npm install`
4. Start command: `npm start`
5. Choose the Free instance for a prototype and deploy. Open the `onrender.com` URL.

Free Render web services can sleep after inactivity and take around a minute to wake. This is a hobby prototype, not production infrastructure.

## Important prototype limitation
This is a first networking bridge, not a fully authoritative competitive game server. It syncs room membership and basic player state, but game rules such as ball possession, scoring, fouls/free throws, and collision outcomes still run mainly on each browser. Before public competitive use, those rules should be moved to the server to prevent desync/cheating. Current 2v2 is not a fully implemented four-player team simulation yet.
