async function main() {
  const ports = [8829, 8830, 8831, 8832];
  for (const port of ports) {
    try {
      console.log(`Trying http://localhost:${port}/api/ads ...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`http://localhost:${port}/api/ads`, { signal: controller.signal });
      clearTimeout(timeoutId);
      console.log(`Success on port ${port}! Status:`, res.status);
      const text = await res.text();
      console.log('Body:', text);
      return;
    } catch (e) {
      console.log(`Failed on port ${port}:`, e.message);
    }
  }
  console.error('Could not connect to any port.');
}
main();
