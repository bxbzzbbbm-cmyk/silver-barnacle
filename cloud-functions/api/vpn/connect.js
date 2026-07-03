const mockIPs = {
  US: "104.26.7.%d",
  MD: "185.33.14.%d",
  GB: "178.62.22.%d",
  CA: "142.44.215.%d",
  DE: "195.201.97.%d",
  JP: "139.162.65.%d",
  AU: "103.108.92.%d",
  FR: "163.172.32.%d",
  NL: "185.56.137.%d",
  CH: "185.156.73.%d",
};

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const country = body.country || "US";
    const template = mockIPs[country] || mockIPs.US;
    const ip = template.replace("%d", Math.floor(Math.random() * 254 + 1));
    return new Response(
      JSON.stringify({ status: "connected", country, ip, message: "VPN connected successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ status: "error", message: "Failed to connect" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
