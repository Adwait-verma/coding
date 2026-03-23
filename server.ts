import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import * as cheerio from "cheerio";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API to fetch LeetCode stats (using a public unofficial API or scraping)
  app.get("/api/leetcode/:username", async (req, res) => {
    try {
      const { username } = req.params;
      // Using an unofficial API for simplicity, fallback to scraping if needed
      const response = await axios.get(`https://leetcode-stats-api.herokuapp.com/${username}`);
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch LeetCode data" });
    }
  });

  // API to fetch GFG stats (Scraping as there's no official public API)
  app.get("/api/gfg/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const url = `https://www.geeksforgeeks.org/user/${username}/`;
      const { data } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      const $ = cheerio.load(data);
      
      const totalSolved = $(".scoreCard_head_left_2__98p7").first().text() || "0";
      const codingScore = $(".scoreCard_head_left_2__98p7").eq(1).text() || "0";
      
      // This is a simplified scrape, GFG structure changes often
      res.json({
        username,
        totalSolved: parseInt(totalSolved),
        codingScore: parseInt(codingScore),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch GFG data" });
    }
  });

  // API to fetch Codeforces stats
  app.get("/api/codeforces/:handle", async (req, res) => {
    try {
      const { handle } = req.params;
      const response = await axios.get(`https://codeforces.com/api/user.status?handle=${handle}`);
      if (response.data.status === "OK") {
        const submissions = response.data.result;
        const solvedProblems = new Set();
        submissions.forEach((sub: any) => {
          if (sub.verdict === "OK") {
            const problemId = `${sub.problem.contestId}-${sub.problem.index}`;
            solvedProblems.add(problemId);
          }
        });
        res.json({
          handle,
          totalSolved: solvedProblems.size,
        });
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch Codeforces data" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
