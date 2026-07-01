const urls = [
  "https://google.com",
  "https://github.com",
  "https://stackoverflow.com",
  "https://wikipedia.org",
  "https://reddit.com",
];

export async function onRequestGet(context) {
  const randomUrl = urls[Math.floor(Math.random() * urls.length)];
  return new Response(JSON.stringify({ url: randomUrl }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
