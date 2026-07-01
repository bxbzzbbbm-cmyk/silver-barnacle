export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const { VPN_API_BASE_URL, VPN_API_KEY } = context.env || {};

    let body;
    try {
      body = await context.request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const country = body.country;
    if (!country) {
      return new Response(JSON.stringify({ error: "Missing 'country' field" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!VPN_API_BASE_URL || !VPN_API_KEY) {
      // Mock fallback for demo
      return new Response(
        JSON.stringify({
          status: "connected",
          country: country,
          server: `${country.toLowerCase()}-vpn-server-01`,
          ip: `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          protocol: "WireGuard",
          connectedAt: new Date().toISOString(),
          bandwidth: "500 Mbps",
          mock: true,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const response = await fetch(`${VPN_API_BASE_URL}/connect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${VPN_API_KEY}`,
      },
      body: JSON.stringify({ country }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({
          error: "VPN provider API error",
          details: errorText,
          providerStatus: response.status,
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error", message: err.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
