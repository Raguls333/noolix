import { ApprovalEvent } from '../models/ApprovalEvent.model.js';
export async function appendEvent(e){ await ApprovalEvent.create(e); }
