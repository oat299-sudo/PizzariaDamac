async function run() {
  const res = await fetch('https://corsproxy.io/?' + encodeURIComponent('https://maps.app.goo.gl/AipUucBBovnz24gR8'));
  const text = await res.text();
  console.log('Match @:', text.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/)?.slice(1,3));
  console.log('Match 3d4d:', text.match(/3d(-?\d+(?:\.\d+)?).*?4d(-?\d+(?:\.\d+)?)/)?.slice(1,3));
  console.log('Match ll:', text.match(/ll=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/)?.slice(1,3));
}
run();
