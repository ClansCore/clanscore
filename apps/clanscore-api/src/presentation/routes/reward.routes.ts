import { Router } from "express";
import * as ctl from "../controllers/reward.controller";

export const rewardsRouter = Router();

rewardsRouter.get("/", ctl.getRewards);
rewardsRouter.post("/", ctl.addReward);
rewardsRouter.patch("/:rewardId", ctl.updateReward);
rewardsRouter.delete("/:rewardId", ctl.deleteReward);
rewardsRouter.post("/:id/claim", ctl.claimReward);

rewardsRouter.post("/accept-claim", ctl.acceptRewardClaim);
rewardsRouter.post("/deny-claim", ctl.denyRewardClaim);
