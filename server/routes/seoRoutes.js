import express from "express";
import db from "../models/index.js";

const router = express.Router();

router.get("/sitemap.xml", async (req, res) => {
  const products = await db.Product.findAll({
    attributes: ["id", "updatedAt"],
  });

  const baseUrl = "https://jaytrix.co.tz";

  const urls = products
    .map(
      (p) => `
  <url>
    <loc>${baseUrl}/products/${p.id}</loc>
    <lastmod>${p.updatedAt.toISOString()}</lastmod>
  </url>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  res.header("Content-Type", "application/xml");
  res.send(xml);
});

export default router;

