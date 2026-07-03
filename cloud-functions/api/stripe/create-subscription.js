export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    // Mock subscription response (no real Stripe server-side call since no secret key env var)
    return new Response(
      JSON.stringify({
        success: true,
        subscription_id: "sub_mock_" + Date.now(),
        trial_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        message: "7-day free trial activated",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, message: "Failed to create subscription" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
