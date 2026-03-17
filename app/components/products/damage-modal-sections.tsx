type DamageProduct = {
  id: string;
  product: string;
  sku: string;
  warrantyExpire: string | null;
  cost: string | null;
  status: string;
};

type DamageModalSectionsProps = {
  product: DamageProduct;
  isUnderService: boolean;
  repairable: string;
  sentToService: string;
  serviceVendor: string;
  serviceReturnDate: string;
  notes: string;
  serviced: string;
  serviceDate: string;
  serviceCost: string;
  serviceMessage: string;
  serviceFailureReason: string;
  setRepairable: (value: string) => void;
  setSentToService: (value: string) => void;
  setServiceVendor: (value: string) => void;
  setServiceReturnDate: (value: string) => void;
  setNotes: (value: string) => void;
  setServiced: (value: string) => void;
  setServiceDate: (value: string) => void;
  setServiceCost: (value: string) => void;
  setServiceMessage: (value: string) => void;
  setServiceFailureReason: (value: string) => void;
};

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold uppercase text-gray-400">{label}</div>
      <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
        {value}
      </div>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  min,
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  min?: string;
  step?: string;
}) {
  return (
    <label className="text-sm font-medium text-gray-700">
      {label}
      <input
        className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        min={min}
        step={step}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <label className={`text-sm font-medium text-gray-700 ${className ?? ""}`}>
      {label}
      <textarea
        className="mt-2 min-h-[90px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={`Add ${label.toLowerCase()}`}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="text-sm font-medium text-gray-700">
      {label}
      <select
        className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "yes" ? "Yes" : "No"}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function DamageModalSections({
  product,
  isUnderService,
  repairable,
  sentToService,
  serviceVendor,
  serviceReturnDate,
  notes,
  serviced,
  serviceDate,
  serviceCost,
  serviceMessage,
  serviceFailureReason,
  setRepairable,
  setSentToService,
  setServiceVendor,
  setServiceReturnDate,
  setNotes,
  setServiced,
  setServiceDate,
  setServiceCost,
  setServiceMessage,
  setServiceFailureReason,
}: DamageModalSectionsProps) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Summary label="Product" value={product.product} />
        <Summary label="SKU" value={product.sku} />
        <Summary
          label="Warranty Expire"
          value={
            product.warrantyExpire
              ? new Date(product.warrantyExpire).toLocaleDateString()
              : "-"
          }
        />
        <Summary label="Cost" value={product.cost ?? "-"} />
      </div>

      {isUnderService ? (
        <>
          <SelectField
            label="Product serviced"
            value={serviced}
            onChange={(next) => {
              setServiced(next);
              if (next === "yes") setServiceDate(new Date().toISOString().slice(0, 10));
            }}
            options={["yes", "no"]}
          />

          {serviced === "yes" && (
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput
                label="Service date"
                type="date"
                value={serviceDate || new Date().toISOString().slice(0, 10)}
                onChange={setServiceDate}
              />
              <TextInput
                label="Repair cost"
                type="number"
                value={serviceCost}
                onChange={setServiceCost}
                min="0"
                step="0.01"
                placeholder="0.00"
              />
              <TextArea
                label="Message"
                value={serviceMessage}
                onChange={setServiceMessage}
                className="md:col-span-2"
              />
            </div>
          )}

          {serviced === "no" && (
            <TextArea
              label="Reason"
              value={serviceFailureReason}
              onChange={setServiceFailureReason}
            />
          )}
        </>
      ) : (
        <>
          <SelectField
            label="Is it repairable?"
            value={repairable}
            onChange={setRepairable}
            options={["yes", "no"]}
          />

          {repairable === "yes" && (
            <SelectField
              label="Sent to service"
              value={sentToService}
              onChange={setSentToService}
              options={["yes", "no"]}
            />
          )}

          {repairable === "yes" && sentToService === "yes" && (
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput
                label="Service vendor"
                value={serviceVendor}
                onChange={setServiceVendor}
                placeholder="Vendor name"
              />
              <TextInput
                label="Return date"
                type="date"
                value={serviceReturnDate}
                onChange={setServiceReturnDate}
              />
            </div>
          )}

          {repairable === "no" && (
            <TextArea label="Reason" value={notes} onChange={setNotes} />
          )}
        </>
      )}
    </>
  );
}
