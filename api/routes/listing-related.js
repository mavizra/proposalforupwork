import { Hono } from "hono";
import { selectDataSource } from "../utils.js";
import { listingRelatedMockUtils } from "../utils.js";

const listingRelatedRouter = new Hono();

listingRelatedRouter.get("/", async (c) => {
  const id = c.req.param("id");

  const mockLogic = async (c2) => listingRelatedMockUtils.getRelatedListingData(c2, id);

  const dbLogic = async (c2) => {
    // optional later
    return Response.json({ error: "Not implemented" }, { status: 501 });
  };

  return selectDataSource(c, dbLogic, mockLogic);
});

export default listingRelatedRouter;
