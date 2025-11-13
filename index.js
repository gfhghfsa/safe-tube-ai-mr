import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const YT_API_KEY = process.env.YT_API_KEY;

if (!YT_API_KEY) {
  console.error("❌ Error: YT_API_KEY is not set in environment variables");
  process.exit(1);
}

// POST /api/search
app.post("/api/search", async (req, res) => {
  const q = req.body.q || "";
  if (!q) return res.status(400).json({ error: "missing query" });

  try {
    const yt = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=15&q=${encodeURIComponent(q)}&key=${YT_API_KEY}`
    );
    const data = await yt.json();

    if (!data.items) return res.json({ results: [] });

    const blockedWords = [
      "sex","sexy","nude","naked","porn","hentai","xxx",
      "hot girl","adult","nsfw","intercourse","erotic"
    ];

    const results = data.items
      .filter(v => {
        const text = (v.snippet.title + " " + v.snippet.description).toLowerCase();
        return !blockedWords.some(w => text.includes(w));
      })
      .map(v => ({
        videoId: v.id.videoId,
        title: v.snippet.title,
        channel: v.snippet.channelTitle,
        thumbnail: v.snippet.thumbnails.medium.url,
        publishedAt: v.snippet.publishedAt
      }));

    res.json({ results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
