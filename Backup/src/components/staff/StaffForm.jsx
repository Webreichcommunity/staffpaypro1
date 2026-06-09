import { Button, Card, Input, Select } from "../common/UI";

const fields = [
  ["name", "Full name", "text"],
  ["email", "Email", "email"],
  ["password", "Password", "password"],
  ["phone", "Phone", "tel"],
  ["address", "Address", "text"],
  ["dob", "Date of birth", "date"],
  ["joiningDate", "Joining date", "date"],
  ["designation", "Role / designation", "text"],
  ["department", "Department", "text"],
  ["monthlySalary", "Monthly salary", "number"],
  ["bankName", "Bank name", "text"],
  ["accountNumber", "Account number", "text"],
  ["ifsc", "IFSC", "text"],
  ["upiId", "UPI ID", "text"],
  ["emergencyContact", "Emergency contact", "text"],
  ["photoUrl", "Staff photo URL", "url"],
];

export const StaffForm = ({ values, onChange, onSubmit, loading, editing = false }) => (
  <Card>
    <form onSubmit={onSubmit} className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fields.filter(([name]) => editing ? name !== "password" : true).map(([name, label, type]) => (
          <Input
            key={name}
            label={label}
            type={type}
            required={["name", "email", "password", "monthlySalary"].includes(name)}
            value={values[name] || ""}
            onChange={(event) => onChange(name, event.target.value)}
          />
        ))}
        <Select label="Gender" value={values.gender || ""} onChange={(event) => onChange("gender", event.target.value)}>
          <option value="">Select</option>
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </Select>
        <Select label="Salary type" value={values.salaryType || "Monthly"} onChange={(event) => onChange("salaryType", event.target.value)}>
          <option>Monthly</option>
          <option>Daily</option>
        </Select>
        <Select label="Status" value={String(values.isActive ?? true)} onChange={(event) => onChange("isActive", event.target.value === "true")}>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </Select>
      </div>
      <Button type="submit" loading={loading} className="w-full sm:w-max">
        {editing ? "Update Staff" : "Create Staff Account"}
      </Button>
    </form>
  </Card>
);
