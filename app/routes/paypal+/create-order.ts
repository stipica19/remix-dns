import { json, type ActionFunction } from "@remix-run/node";
import { createPaypalOrder, getAccessToken } from "~/utils/paypal.server";

export const action: ActionFunction = async ({ request }) => {
  const body = await request.json();
  const { price } = body;

  const token = await getAccessToken();
  console.log("tokennnnnnnnnnnnnnnnnn,token", token);

  const order = await createPaypalOrder(token, price);
    const approvalLink = order.links.find((link: any) => link.rel === "approve")?.href;

  return json({ id: order.id, approvalUrl: approvalLink });
};
