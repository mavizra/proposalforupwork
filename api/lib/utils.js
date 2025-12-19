/**
 * Selects appropriate data source based on database availability
 * Falls back to mock logic if DB logic fails or DB is unavailable.
 *
 * Optional override via query param:
 *   ?source=mock  forces mock
 *   ?source=db    forces db (will error if dbLogic fails)
 *
 * @param {object} c - Hono context
 * @param {function} dbLogic - Function to execute when DB is available
 * @param {function} mockLogic - Function to execute when using mock data
 * @returns {Promise<Response>} API response
 */
export async function selectDataSource(c, dbLogic, mockLogic) {
	const sourceParam =
		(typeof c.req.query === "function" && c.req.query("source")) ||
		(typeof c.req.query === "function" && c.req.query()?.source);

	if (sourceParam === "mock") {
		return await mockLogic(c);
	}

	if (sourceParam === "db") {
		return await dbLogic(c);
	}

	// Support either env.SQL (your earlier route example) or env.DB (common CF patterns)
	const hasDb = Boolean(c?.env && (c.env.SQL || c.env.DB));

	if (!hasDb) {
		return await mockLogic(c);
	}

	try {
		return await dbLogic(c);
	} catch (err) {
		console.error("DB logic failed, falling back to mock data:", err);
		return await mockLogic(c);
	}
}

/**
 * Contains mock data logic functions for listing-related endpoints
 */
export const listingRelatedMockUtils = {
	/**
	 * Generates mock related listings response
	 * @param {object} c - Hono context
	 * @param {string} listingId - Listing ID to fetch related data for
	 * @returns {Promise<Response>} Mock API response
	 */
	getRelatedListingData: async (c, listingId) => {
		const listingIdNum = parseInt(listingId, 10);
		const listing = c.env.MOCK_DATA.find((x) => x.id === listingIdNum);

		if (!listing) {
			return Response.json({ error: "Listing not found" }, { status: 404 });
		}

		const listingCity = listing.city;
		const listingType = listing.type;

		// Same city
		const relatedInCity = c.env.MOCK_DATA.filter(
			(x) => x.city === listingCity && x.id !== listingIdNum,
		).slice(0, 3);

		// Same type
		const relatedByType = c.env.MOCK_DATA.filter(
			(x) => x.type === listingType && x.id !== listingIdNum,
		).slice(0, 3);

		// Similar price
		const similarPrice = c.env.MOCK_DATA
			.filter((x) => x.id !== listingIdNum)
			.sort(
				(a, b) =>
					Math.abs(a.price - listing.price) - Math.abs(b.price - listing.price),
			)
			.slice(0, 3);

		// City counts
		const cities = {};
		c.env.MOCK_DATA.forEach((x) => {
			cities[x.city] = (cities[x.city] || 0) + 1;
		});
		const cityStats = Object.entries(cities)
			.map(([city, count]) => ({ city, count }))
			.sort((a, b) => b.count - a.count);

		// Type counts
		const types = {};
		c.env.MOCK_DATA.forEach((x) => {
			types[x.type] = (types[x.type] || 0) + 1;
		});
		const typeStats = Object.entries(types)
			.map(([type, count]) => ({ type, count }))
			.sort((a, b) => b.count - a.count);

		return Response.json({
			listingId,
			listingCity,
			listingType,
			relatedInCity,
			relatedByType,
			similarPrice,
			cityStats,
			typeStats,
			source: "mock",
		});
	},
};

/**
 * Contains mock data logic functions for listings endpoints
 */
export const listingsMockUtils = {
	/**
	 * Generates mock listings list with optional filtering and sorting
	 * @param {object} c - Hono context
	 * @param {object} filters - Optional filters
	 * @returns {Promise<Response>} Mock API response
	 */
	getListingsList: async (c, filters = {}) => {
		let results = [...c.env.MOCK_DATA];

		const q = (filters.q || "").toString().trim().toLowerCase();
		if (q) {
			results = results.filter((x) =>
				`${x.title} ${x.city} ${x.address || ""} ${x.type}`.toLowerCase().includes(q),
			);
		}

		if (filters.city) {
			results = results.filter((x) => x.city === filters.city);
		}

		if (filters.type) {
			results = results.filter((x) => x.type === filters.type);
		}

		const minPrice =
			filters.minPrice !== undefined && filters.minPrice !== null && filters.minPrice !== ""
				? Number(filters.minPrice)
				: null;
		const maxPrice =
			filters.maxPrice !== undefined && filters.maxPrice !== null && filters.maxPrice !== ""
				? Number(filters.maxPrice)
				: null;

		if (minPrice !== null && !Number.isNaN(minPrice)) {
			results = results.filter((x) => x.price >= minPrice);
		}
		if (maxPrice !== null && !Number.isNaN(maxPrice)) {
			results = results.filter((x) => x.price <= maxPrice);
		}

		const beds =
			filters.beds !== undefined && filters.beds !== null && filters.beds !== ""
				? Number(filters.beds)
				: null;
		if (beds !== null && !Number.isNaN(beds)) {
			results = results.filter((x) => Number(x.beds || 0) >= beds);
		}

		// Sorting
		switch (filters.sort) {
			case "price_asc":
				results.sort((a, b) => a.price - b.price);
				break;
			case "price_desc":
				results.sort((a, b) => b.price - a.price);
				break;
			case "area_desc":
				results.sort((a, b) => (b.area_m2 || 0) - (a.area_m2 || 0));
				break;
			case "newest":
				results.sort(
					(a, b) =>
						new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
				);
				break;
			default:
				// no-op
				break;
		}

		return Response.json({
			listings: results,
			source: "mock",
		});
	},

	/**
	 * Generates mock listing detail response
	 * @param {object} c - Hono context
	 * @param {string} listingId - Listing ID to fetch
	 * @returns {Promise<Response>} Mock API response
	 */
	getListingDetail: async (c, listingId) => {
		const listingIdNum = parseInt(listingId, 10);
		const listing = c.env.MOCK_DATA.find((x) => x.id === listingIdNum);

		if (!listing) {
			return Response.json({ error: "Listing not found" }, { status: 404 });
		}

		return Response.json({
			listing,
			source: "mock",
		});
	},
};
