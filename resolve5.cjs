async function run() {
  const res = await fetch('https://api.allorigins.win/get?url=' + encodeURIComponent('https://maps.app.goo.gl/AipUucBBovnz24gR8'));
  const text = await res.text();
  console.log(text.substring(0, 500));
}
run();
