import { json, type ActionFunction } from "@remix-run/node";
import { db } from "~/services/db.server";

export const action: ActionFunction = async ({ request }) => {
  const body = await request.json();
  const { userId, packageId, amount,period,zoneId } = body;

  console.log("body-----------------------------------------", body);

  const expiresAt = new Date(); //današnji datum
  // Postavi datum isteka na mjesec dana od danas ili godinu dana ako je period "yearly"
  expiresAt.setMonth(expiresAt.getMonth() + (period === "yearly" ? 12 : 1));

  // 1. Dohvati podatke o paketu
  const paket = await db.packages.findUnique({
    where: { id: packageId },
  });

  if (!paket) {
    return json({ error: "Paket ne postoji" }, { status: 400 });
  }

  // 2. Kreiraj order
const order = await db.orders.create({
    data: {
      user_id: userId,
      status: "paid",
      payment_provider: "paypal",
      total_price: parseFloat(amount),
      created_at: expiresAt,
      order_items: {
        create: {
          package_id: packageId,
          quantity: 1,
          price_each: parseFloat(amount),
          valid_until: expiresAt,
        },
      },
    },
    include: { order_items: true },
  });

  const orderItem = order.order_items[0];

  await db.zone_package.create({
    data: {
      zone_id: zoneId,
      order_item_id: orderItem.id,
    },
  });

  await db.zones.update({
    where: { id: zoneId },
    data: { is_active: 1 },
  });

  return json({ success: true });
};
