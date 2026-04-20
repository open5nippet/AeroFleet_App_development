import { Router, type IRouter } from "express";
import healthRouter from "./health";
import mapboxRouter from "./mapbox";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/mapbox", mapboxRouter);

export default router;
