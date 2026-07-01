export async function onRequestGet(context) {
  const ramOptions = [1024, 512, 2048, 4096, 1536];
  const randomIndex = Math.floor(Math.random() * ramOptions.length);
  const ramSize = ramOptions[randomIndex];

  return new Response(
    JSON.stringify({
      ram_size_mb: ramSize,
      unit: 'MB',
      available_options: ramOptions,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      },
    }
  );
}
