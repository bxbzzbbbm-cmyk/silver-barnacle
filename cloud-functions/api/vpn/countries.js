const countries = [
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "MD", name: "Moldova", flag: "🇲🇩" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
];

export async function onRequestGet(context) {
  return new Response(
    JSON.stringify({ countries }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
