export async function onRequestPost(context) {
  try {
    const { VPN_API_BASE_URL, VPN_API_KEY } = context.env || {};

    if (!VPN_API_BASE_URL || !VPN_API_KEY) {
      // Mock fallback for demo
      return new Response(
        JSON.stringify({
          status: "disconnected",
          disconnectedAt: new Date().toISOString(),
          duration: "45m 12s",
          dataUsed: "1.2 GB",
          mock: true,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const response = await fetch(`${VPN_API_BASE_URL}/disconnect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${VPN_API_KEY}`,
      },
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
