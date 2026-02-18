import { Router } from "express";
import * as ctl from "../controllers/donation.controller";

export const donationsRouter = Router();

donationsRouter.post("/", ctl.saveDonation);
donationsRouter.patch("/:id/donor", ctl.updateDonationDonor);
donationsRouter.get("/by-person/:personId", ctl.getDonationsByPersonId);

