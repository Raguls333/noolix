import mongoose from "mongoose";
import { ok } from "../utils/response.js";
import { ChangeRequest } from "../models/ChangeRequest.model.js";
import { Commitment } from "../models/Commitment.model.js";
import { ROLES } from "../constants/roles.js";

function toPageOptions(query) {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 50), 1), 200);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export async function listChangeRequestsQueue(req, res) {
  const { status, commitmentId } = req.validated.query;
  const { page, limit, skip } = toPageOptions(req.validated.query);

  const match = { orgId: new mongoose.Types.ObjectId(req.user.orgId) };
  if (status) match.status = status;
  if (commitmentId) match.commitmentId = new mongoose.Types.ObjectId(commitmentId);

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: Commitment.collection.name,
        localField: "commitmentId",
        foreignField: "_id",
        as: "commitment",
      },
    },
    { $unwind: "$commitment" },
  ];

  if (req.user.role === ROLES.MANAGER) {
    pipeline.push({
      $match: { "commitment.assignedToUserId": new mongoose.Types.ObjectId(req.user.userId) },
    });
  }

  pipeline.push(
    {
      $project: {
        orgId: 1,
        commitmentId: 1,
        commitmentVersion: 1,
        reason: 1,
        status: 1,
        requestedByType: 1,
        requestedBy: 1,
        createdAt: 1,
        commitment: {
          _id: 1,
          title: 1,
          version: 1,
          status: 1,
          assignedToUserId: 1,
          previousCommitmentId: 1,
          rootCommitmentId: 1,
        },
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        items: [{ $skip: skip }, { $limit: limit }],
        total: [{ $count: "count" }],
      },
    }
  );

  const result = await ChangeRequest.aggregate(pipeline);
  const items = result?.[0]?.items || [];
  const total = result?.[0]?.total?.[0]?.count || 0;

  return ok(res, { items, page, limit, total }, req.id);
}
