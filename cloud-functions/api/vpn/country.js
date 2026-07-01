export async function onRequestGet(context) {
  try {
    const { VPN_API_BASE_URL, VPN_API_KEY } = context.env || {};

    if (!VPN_API_BASE_URL || !VPN_API_KEY) {
      // Mock fallback with common VPN countries
      const mockCountries = [
        { id: "us", name: "United States" },
        { id: "uk", name: "United Kingdom" },
        { id: "de", name: "Germany" },
        { id: "jp", name: "Japan" },
        { id: "fr", name: "France" },
        { id: "ca", name: "Canada" },
        { id: "au", name: "Australia" },
        { id: "nl", name: "Netherlands" },
        { id: "sg", name: "Singapore" },
        { id: "se", name: "Sweden" },
        { id: "ch", name: "Switzerland" },
        { id: "no", name: "Norway" },
        { id: "kr", name: "South Korea" },
        { id: "in", name: "India" },
        { id: "br", name: "Brazil" },
      ];
      return new Response(JSON.stringify({ countries: mockCountries, mock: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const response = await fetch(`${VPN_API_BASE_URL}/countries`, {
      method: "GET",
      headers: {
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
