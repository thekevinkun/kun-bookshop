import { Request, Response } from "express"; // Express request/response types
import { Book } from "../models/Book";

// The production site URL — used to build absolute URLs in the sitemap
// Falls back to localhost for local development
const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

// Generates an XML sitemap and sends it as the response
// Google reads this file to discover all the pages on your site
export async function getSitemap(req: Request, res: Response): Promise<void> {
  try {
    // Fetch only the _id and updatedAt fields of all active books
    // We don't need the full document — just enough to build the URL and lastmod date
    const books = await Book.find({ isActive: true })
      .select("_id updatedAt") // only fetch what we need — faster query
      .lean(); // return plain JS objects instead of Mongoose documents

    // These are the static pages that always exist — every site has these
    // lastmod is today's date — these pages change with deployments
    const today = new Date().toISOString().split("T")[0]; // format: "2025-04-15"

    const staticPages = [
      { url: "/", priority: "1.0", changefreq: "daily" }, // homepage — highest priority
      { url: "/browse", priority: "0.9", changefreq: "daily" }, // browse — changes often as books are added
    ];

    // Build the <url> block for each static page
    const staticUrlTags = staticPages
      .map(
        (page) => `
        <url>
          <loc>${SITE_URL}${page.url}</loc>
          <lastmod>${today}</lastmod>
          <changefreq>${page.changefreq}</changefreq>
          <priority>${page.priority}</priority>
        </url>`,
      )
      .join("");

    // Build the <url> block for each book's detail page
    // updatedAt tells Google when the page content last changed
    const bookUrlTags = books
      .map((book) => {
        // Format the updatedAt date as YYYY-MM-DD for the sitemap
        const lastmod = new Date(book.updatedAt as Date)
          .toISOString()
          .split("T")[0];

        return `
        <url>
          <loc>${SITE_URL}/books/${book._id}</loc>
          <lastmod>${lastmod}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.8</priority>
        </url>`;
      })
      .join("");

    // Assemble the full XML sitemap document
    // urlset is the root element — xmlns is the required schema declaration
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${staticUrlTags}
      ${bookUrlTags}
      </urlset>`;

    // Tell the browser and Google this is XML, not HTML
    res.setHeader("Content-Type", "application/xml");

    // Cache the sitemap for 1 hour — it doesn't need to be regenerated on every request
    // This reduces database load when Google crawls frequently
    res.setHeader("Cache-Control", "public, max-age=3600");

    // Send the XML string as the response body
    res.status(200).send(xml);
  } catch (error) {
    // If something goes wrong, send a 500 so Google knows to retry later
    res.status(500).json({ message: "Failed to generate sitemap" });
  }
}
