import { Badge } from "../common/UI";

export const AttendanceStatusBadge = ({ status }) => <Badge tone={status}>{status || "pending"}</Badge>;
