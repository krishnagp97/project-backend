import { Router } from "express";

const router = Router();

router.route("/").get((req, res) => {
    res.send("namaste");
});

export default router;
