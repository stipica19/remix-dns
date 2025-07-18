import { useEffect } from "react";

declare global {
  interface Window {
    paypal?: any;
  }
}

export default function PaypalButton({
  userId,
  packageId,
  amount,
  period,
  zoneId,
}: {
  userId: number;
  packageId: number;
  amount: string;
  period: "monthly" | "yearly";
  zoneId?: number; // opcionalno ako je potrebno za kontekst
}) {
  useEffect(() => {
    if (!window.paypal) return;

    const containerId = `paypal-btn-${packageId}`;
    const container = document.getElementById(containerId);

    // ⛔ Očisti prethodni sadržaj prije novog renderovanja
    if (container) {
      container.innerHTML = "";
    }

    window.paypal
      .Buttons({
        createOrder: async (): Promise<string> => {
          const res = await fetch("/paypal/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ price: amount }),
          });
          const data = await res.json();
          return data.id;
        },
        onApprove: async (_data: any, actions: any) => {
          await actions.order.capture();

          await fetch("/paypal/complete-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, packageId, amount, period, zoneId }),
          });

          alert("Plaćanje uspješno!");
          window.location.href = "/zones";
        },
        onError: (err: any) => {
          console.error("Greška pri PayPal plaćanju:", err);
          alert("Došlo je do greške s PayPalom.");
        },
      })
      .render(`#${containerId}`);
  }, [packageId, amount, period]); // 🔁 Dodaj i dependency da se re-renderuje kad promijeniš

  return <div id={`paypal-btn-${packageId}`} />;
}
