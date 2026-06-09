import { Button, Card, Select, Textarea, Input } from "../common/UI";

export const LeaveForm = ({ values, onChange, onSubmit, loading }) => (
  <Card>
    <form onSubmit={onSubmit} className="grid gap-4">
      <Select label="Leave type" value={values.leaveType || "Full Day"} onChange={(event) => onChange("leaveType", event.target.value)}>
        <option>Full Day</option>
        <option>Half Day</option>
        <option>Paid Leave</option>
        <option>Unpaid Leave</option>
        <option>Emergency Leave</option>
      </Select>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="From date" type="date" required value={values.fromDate || ""} onChange={(event) => onChange("fromDate", event.target.value)} />
        <Input label="To date" type="date" required value={values.toDate || ""} onChange={(event) => onChange("toDate", event.target.value)} />
      </div>
      <Textarea label="Reason" required value={values.reason || ""} onChange={(event) => onChange("reason", event.target.value)} />
      <Input label="Attachment URL optional" value={values.attachmentUrl || ""} onChange={(event) => onChange("attachmentUrl", event.target.value)} />
      <Button type="submit" loading={loading} className="w-full sm:w-max">Apply Leave</Button>
    </form>
  </Card>
);
