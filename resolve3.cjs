async function run() {
  const res = await fetch('https://maps.app.goo.gl/AipUucBBovnz24gR8', { redirect: 'manual' });
  console.log('Status:', res.status);
  console.log('Location:', res.headers.get('location'));
}
run();
