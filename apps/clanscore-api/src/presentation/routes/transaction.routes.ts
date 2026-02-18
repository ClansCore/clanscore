import { Router } from "express";
import * as ctl from "../controllers/transaction.controller";

export const transactionsRouter = Router();

transactionsRouter.post("/", ctl.saveTransaction);
transactionsRouter.get("/by-donation/:donationId", ctl.getTransactionByDonationId);
transactionsRouter.get("/by-person/:personId", ctl.getTransactionsByPersonId);

