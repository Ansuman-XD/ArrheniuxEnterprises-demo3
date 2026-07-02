import { PRINT_METHODS, type PrintSelection, printPricePerPc } from "@/data/printOptions";

type Props = {
  value: PrintSelection;
  onChange: (v: PrintSelection) => void;
  qty: number;
};

export const PrintPicker = ({ value, onChange, qty }: Props) => {
  const activeMethod = value.method
    ? PRINT_METHODS.find((m) => m.id === value.method)
    : null;

  const setMethod = (mid: "embroidery" | "dtf" | "") => {
    if (mid === "") onChange({ method: null, options: [] });
    else onChange({ method: mid, options: [] });
  };

  const toggleOption = (oid: string) => {
    if (!value.options.includes(oid)) {
      onChange({ ...value, options: [...value.options, oid] });
    } else {
      onChange({ ...value, options: value.options.filter((x) => x !== oid) });
    }
  };

  const perPc = printPricePerPc(value);
  const totalCharge = perPc * qty;

  return (
    <div className="mt-2">
      <h4 className="text-xs uppercase tracking-widest font-bold mb-2">Print Type</h4>
      <select
        value={value.method ?? ""}
        onChange={(e) => setMethod(e.target.value as "embroidery" | "dtf" | "")}
        className="w-full border border-border px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-ink"
      >
        <option value="">No Print</option>
        {PRINT_METHODS.map((m) => (
          <option key={m.id} value={m.id}>{m.label}</option>
        ))}
      </select>

      {activeMethod && (
        <div className="mt-3 border border-border bg-secondary/40 p-3 space-y-1.5">
          {activeMethod.options.map((o) => {
            const checked = value.options.includes(o.id);
            return (
              <label key={o.id} className="flex items-center justify-between text-sm cursor-pointer hover:bg-cream/50 px-2 py-1.5">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleOption(o.id)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span>{o.label}</span>
                </span>
                <span className="text-xs font-mono">
                  {o.pricePerPc === 0 ? "FREE" : `+₹${o.pricePerPc}/pc`}
                </span>
              </label>
            );
          })}
          {value.options.length > 0 && (
            <div className="flex justify-between items-center pt-2 mt-2 border-t border-border text-xs">
              <span className="uppercase tracking-widest text-muted-foreground">Print charge</span>
              <span className="font-bold">₹{perPc}/pc × {qty} = ₹{totalCharge}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
