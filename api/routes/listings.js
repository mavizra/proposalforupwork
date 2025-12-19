import { Hono } from "hono";
import { selectDataSource } from "../utils.js";
import { listingsMockUtils } from "../utils.js";

const listingsRouter = new Hono();

listingsRouter.get("/", async (c) => {
  const { city, type, sort, q, minPrice, maxPrice, beds } = c.req.query();

  const mockLogic = async (c2) => listingsMockUtils.getListingsList(c2, {
    city, type, sort, q, minPrice, maxPrice, beds
  });

  // If you later add DB, mirror the dbLogic similar to books.js.
  const dbLogic = async (c2) => {
    const sql = c2.env.SQL;
    let query = sql`SELECT * FROM public.listings`;

    // Keep it simple now, add filters later
    const results = await query;
    return Response.json({ listings: results, source: "database" });
  };

  return selectDataSource(c, dbLogic, mockLogic);
});

listingsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");

  const mockLogic = async (c2) => listingsMockUtils.getListingDetail(c2, id);

  const dbLogic = async (c2) => {
    const sql = c2.env.SQL;
    const rows = await sql`SELECT * FROM public.listings WHERE id = ${id}`;
    if (!rows.length) return Response.json({ error: "Listing not found" }, { status: 404 });
    return Response.json({ listing: rows[0], source: "database" });
  };

  return selectDataSource(c, dbLogic, mockLogic);
});

export default listingsRouter;
