async function run() {
  const res = await fetch('https://api.allorigins.win/get?url=' + encodeURIComponent('https://maps.app.goo.gl/AipUucBBovnz24gR8'));
  const data = await res.json();
  console.log(data);
}
run();
