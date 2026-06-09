import { Input } from "./UI";
import { formatDateKey, formatMonthKey } from "../../utils/dateUtils";

export const DateFilter = ({ value, onChange }) => (
  <Input label="Date" type="date" value={value || formatDateKey()} onChange={(event) => onChange(event.target.value)} />
);

export const MonthFilter = ({ value, onChange }) => (
  <Input label="Month" type="month" value={value || formatMonthKey()} onChange={(event) => onChange(event.target.value)} />
);
