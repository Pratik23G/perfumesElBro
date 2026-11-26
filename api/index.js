// Vercel entry: the whole Express app runs as one serverless function (see vercel.json for the rewrite).
// Static files in /public are served by Vercel's CDN and never reach this function.
import app from '../server.js';

export default app;
