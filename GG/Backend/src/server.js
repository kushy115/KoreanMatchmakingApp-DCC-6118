import express from "express";
import configViewEngine from "./config/viewEngine.js";
import initWebRoute from './route/web.js';
import initAPIRoute from './route/api.js';
import cors from 'cors';
import dotenv from 'dotenv';
import { startMCPServer } from './mcp/server.js';
import { fileURLToPath } from 'url';
import path from 'path';
 

dotenv.config();
const app = express();
app.use(cors({credentials: true, origin: 'http://localhost:3000'}));
const port = process.env.PORT || 8080;
const __filename_srv = fileURLToPath(import.meta.url);
const __dirname_srv  = path.dirname(__filename_srv);

//Take data from users
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname_srv, 'uploads')));


configViewEngine(app);
//init web route


initWebRoute(app);
//init API route
initAPIRoute(app);

// Start MCP server
startMCPServer().catch((err) => {
  console.error("Failed to start MCP server:", err);
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
