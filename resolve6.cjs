async function run() {
  const res = await fetch('https://corsproxy.io/?' + encodeURIComponent('https://maps.app.goo.gl/AipUucBBovnz24gR8'));
  console.log('Final URL:', res.url);
  const text = await res.text();
  console.log('Match:', text.match(/<meta content="([^"]+)" property="og:url"/)?.[1]);
}
run();
