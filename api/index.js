// Vercel serverless function for Express app
import { createServer } from './server/index.js';

export default function handler(req, res) {
  // Create Express app instance
  const app = createServer();

  // Handle the request
  return new Promise((resolve, reject) => {
    app(req, res, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}