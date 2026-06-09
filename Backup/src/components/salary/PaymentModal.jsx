import { useState } from "react";
import { Button, Input, Modal, Select, Textarea } from "../common/UI";

export const PaymentModal = ({ report, payment, onClose, onSubmit }) => {
  const [values, setValues] = useState({
    amountPaid: payment?.amountPaid ?? report?.netSalary ?? 0,
    paymentMode: payment?.paymentMode || "Cash",
    paymentDate: payment?.paymentDate || new Date().toISOString().slice(0, 10),
    transactionId: payment?.transactionId || "",
    notes: payment?.notes || "",
  });
  const [loading, setLoading] = useState(false);

  const setField = (key, value) => setValues((current) => ({ ...current, [key]: value }));

  return (
    <Modal title={`${payment ? "Edit" : "Record"} payment: ${report?.staffName}`} onClose={onClose}>
      <form
        className="grid gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setLoading(true);
          await onSubmit(values);
          setLoading(false);
        }}
      >
        <Input label="Amount paid" type="number" value={values.amountPaid} onChange={(event) => setField("amountPaid", event.target.value)} />
        <Select label="Payment mode" value={values.paymentMode} onChange={(event) => setField("paymentMode", event.target.value)}>
          <option>Cash</option>
          <option>UPI</option>
          <option>Bank Transfer</option>
          <option>Other</option>
        </Select>
        <Input label="Payment date" type="date" value={values.paymentDate} onChange={(event) => setField("paymentDate", event.target.value)} />
        <Input label="Transaction ID optional" value={values.transactionId} onChange={(event) => setField("transactionId", event.target.value)} />
        <Textarea label="Notes" value={values.notes} onChange={(event) => setField("notes", event.target.value)} />
        <Button type="submit" loading={loading}>{payment ? "Update Payment" : "Save Payment"}</Button>
      </form>
    </Modal>
  );
};
