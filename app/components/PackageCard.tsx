type Package = {
  id: number;
  name: string;
  price_monthly: number;
  price_yearly: number;
  description: string;
  package_type: string;
};

export function PackageCard({ data }: { data: Package & { userId: number } }) {
  const { name, description, price_monthly, price_yearly, userId } = data;

  const isFree = name.toLowerCase() === "free";
  const formatPrice = (value: number) =>
    new Intl.NumberFormat("hr-HR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(value);

  return (
    <div className="card border rounded p-4 shadow-sm">
      <h2 className="text-xl font-bold mb-2">{name}</h2>

      <ul className="mt-2 list-disc ml-4 text-sm text-gray-600 flex-grow mb-4">
        {description
          .split(/[,.]\s*/) // razdvajamo po točkama, zarezima i razmacima
          .map((part, index) => {
            const cleaned = part.replace(/^[a-z]\.\s*/i, "").trim(); // makni "a. ", "e. " itd.
            return (
              cleaned && (
                <li key={index} className="mb-1">
                  {cleaned}
                </li>
              )
            );
          })}
      </ul>

      <p className="text-gray-700">
        Monthly:{" "}
        <span className="text-[20px] font-bold">
          {formatPrice(price_monthly)}
        </span>
      </p>
      <p className="text-gray-700">
        Yearly:{" "}
        <span className="text-[20px] font-bold">
          {formatPrice(price_yearly)}
        </span>
      </p>
    </div>
  );
}
