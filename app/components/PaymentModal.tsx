import { useState } from "react";
import PaypalButton from "./PaypalButton";

type Package = {
  id: number;
  name: string;
  price_monthly: number;
  price_yearly: number;
  description: string;
  package_type: string;
};

type PaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  zoneId: number;
  packages: Package[];
};

export default function PaymentModal({
  isOpen,
  onClose,
  userId,
  zoneId,
  packages,
}: PaymentModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [period, setPeriod] = useState<"monthly" | "yearly" | null>(null);

  if (!isOpen) return null;

  const amount =
    selectedPackage && period === "monthly"
      ? selectedPackage.price_monthly.toString()
      : selectedPackage?.price_yearly?.toString() ?? "";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-center">
          Odaberi paket za zonu
        </h2>

        {/* Lista paketa */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`border rounded-lg p-4 cursor-pointer ${
                selectedPackage?.id === pkg.id
                  ? "border-blue-500"
                  : "hover:border-blue-300"
              }`}
              onClick={() => {
                setSelectedPackage(pkg);
                setPeriod(null); // resetiraj period pri promjeni paketa
              }}
            >
              <h3 className="text-lg font-semibold">{pkg.name}</h3>

              <p className="mt-2 text-sm text-gray-700">
                Mjesečno: <strong>{pkg.price_monthly} €</strong>
              </p>
              <p className="text-sm text-gray-700">
                Godišnje: <strong>{pkg.price_yearly} €</strong>
              </p>
            </div>
          ))}
        </div>

        {/* Odabir perioda */}
        {selectedPackage && (
          <div className="mt-6 space-y-4">
            <h3 className="font-medium text-center text-gray-800">
              Odaberi period za {selectedPackage.name}
            </h3>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setPeriod("monthly")}
                className={`px-4 py-2 rounded border ${
                  period === "monthly"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-blue-600 border-blue-600"
                }`}
              >
                Mjesečno
              </button>
              <button
                onClick={() => setPeriod("yearly")}
                className={`px-4 py-2 rounded border ${
                  period === "yearly"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-blue-600 border-blue-600"
                }`}
              >
                Godišnje
              </button>
            </div>
          </div>
        )}

        {/* PayPal dugme */}
        {selectedPackage && period && (
          <div className="mt-6">
            <PaypalButton
              userId={userId}
              packageId={selectedPackage.id}
              amount={amount}
              period={period}
              zoneId={zoneId}
            />
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-6 block mx-auto text-sm text-gray-600 hover:underline"
        >
          Zatvori
        </button>
      </div>
    </div>
  );
}
