export async function onRequestPost(context) {
  return new Response(
    JSON.stringify({ status: "disconnected", message: "VPN disconnected successfully" }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
