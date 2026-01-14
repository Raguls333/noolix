import { ExportLog } from '../models/ExportLog.model.js';
export async function logExport(x){ await ExportLog.create(x); }
