export async function getAccessToken() {
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET_ID}`).toString("base64");

  console.log("CLIENT ID:", process.env.PAYPAL_CLIENT_ID);
  console.log("CLIENT SECRET:", process.env.PAYPAL_SECRET_ID);
  console.log("Auth header:", auth);

  const res = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await res.json();
  console.log("PayPal response:", data);
  return data.access_token;
}


export async function createPaypalOrder(token:string,amount:number,currency = "EUR"){


    console.log("tokennnnnnnnnnnnnnnnnn",token)

    const res = await fetch("https://api-m.sandbox.paypal.com/v2/checkout/orders", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            intent: "CAPTURE",
            purchase_units: [{
                amount: {
                    currency_code: currency,
                    value: amount
                }
            }],
            
        })
    });

    const data = await res.json();

  if (!res.ok) {
  console.error("PayPal error response:", data); // <-- Dodano
  throw new Error(`PayPal API error: ${data.message}`);
}
    return data;
}