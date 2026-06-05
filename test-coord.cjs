function parseAnyMapLink(text) {
  if (!text) return null;
  const urlMatch = text.match(/query=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/) || 
                   text.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/) ||
                   text.match(/ll=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/) ||
                   text.match(/3d(-?\d+(?:\.\d+)?).*?4d(-?\d+(?:\.\d+)?)/);
  if (urlMatch) {
      return { lat: parseFloat(urlMatch[1]), lng: parseFloat(urlMatch[2]) };
  }
  const coordMatch = text.match(/(-?\d{1,3}(?:\.\d{3,15})?)\s*,\s*(-?\d{1,3}(?:\.\d{3,15})?)/);
  if (coordMatch) {
      return { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) };
  }
  return null;
}
console.log(parseAnyMapLink('13.9239103, 100.5220632'));
console.log(parseAnyMapLink('https://www.google.com/maps/place/Pizzaria+Damac/@13.9239155,100.5171923,17z/data=!4m6!3m5!1s0x30e285f410f51de9:0x6aaf19efdc8e633a!8m2!3d13.9239103!4d100.5220632'));
console.log(parseAnyMapLink('13.8856,100.5222'));
