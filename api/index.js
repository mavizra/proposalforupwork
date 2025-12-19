import { Hono } from "hono";
import postgres from "postgres";
import listingsRouter from "./routes/listings";
import listingRelatedRouter from "./routes/listing-related";
import { mockBooks as mockListings } from "./lib/mockData";

const app = new Hono();

// Setup SQL client middleware
app.use("*", async (c, next) => {
	// Check if Hyperdrive binding is available
	if (c.env.HYPERDRIVE) {
		try {
			// Create SQL client
			const sql = postgres(c.env.HYPERDRIVE.connectionString, {
				max: 5,
				fetch_types: false,
			});

			c.env.SQL = sql;
			c.env.DB_AVAILABLE = true;

			// Process the request
			await next();

			// Close the SQL connection after the response is sent
			c.executionCtx.waitUntil(sql.end());
		} catch (error) {
			console.error("Database connection error:", error);
			c.env.DB_AVAILABLE = false;
			c.env.MOCK_DATA = mockListings;
			await next();
		}
	} else {
		// No Hyperdrive binding available, use mock data
		console.log("No database connection available. Using mock data.");
		c.env.DB_AVAILABLE = false;
		c.env.MOCK_DATA = mockListings;
		await next();
	}
});

// Listings API routes
app.route("/api/listings", listingsRouter);
app.route("/api/listings/:id/related", listingRelatedRouter);

// Catch-all route for static assets
app.all("*", async (c) => {
	return c.env.ASSETS.fetch(c.req.raw);
});

export default {
	fetch: app.fetch,
};
