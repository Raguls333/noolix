import { ROLES } from "../constants/roles.js";
export function sanitizeCommitmentForRole(commitment, role){
  if(!commitment) return commitment;
  const c={...commitment};
  if(role===ROLES.MANAGER){ delete c.amount; delete c.currency; }
  return c;
}
