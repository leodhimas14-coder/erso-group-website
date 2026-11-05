// Builds a single-file copy of the fuel app (site/karburant/karburanti-offline.html) that
// opens by double-click with no internet. Netlify runs it on every deploy.
// `node scripts/build-karburant.js --demo <out.html>` writes the demo page published on claude.ai,
// `--desktop <out.html>` the page inside the Windows program (desktop/).
// On Netlify, URL is the site's address: the offline file uses it to read photos when online.
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'site', 'karburant');
const read = (f) => fs.readFileSync(path.join(dir, f), 'utf8');
const html = read('index.html');
const css = read('style.css');
// A literal </script> inside the app would end the inline script early.
const js = read('app.js').replace(/<\/script/gi, '<\\/script');
const body = html.slice(html.indexOf('<header'), html.indexOf('<script src'));

const demoAt = process.argv.indexOf('--demo');
const deskAt = process.argv.indexOf('--desktop');
let out;
let page;
if (demoAt > 0) {
  out = process.argv[demoAt + 1];
  page = `<title>Karburanti Demo</title>
<meta name="robots" content="noindex">
<style>
${css}
:root{color-scheme:light}
</style>
${body}<script>window.KARBURANT_DEMO = true;</script>
<script>
${js}
</script>
`;
} else {
  out = deskAt > 0 ? path.resolve(process.argv[deskAt + 1]) : path.join(dir, 'karburanti-offline.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const icon = 'data:image/png;base64,' + fs.readFileSync(path.join(dir, 'icon-192.png')).toString('base64');
  page = `<!DOCTYPE html>
<html lang="sq">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Karburanti</title>
<link rel="icon" href="${icon}">
<style>
${css}
</style>
</head>
<body>
${body}<script>window.KARBURANT_SITE = ${JSON.stringify(process.env.URL || '')};</script>
<script>
${js}
</script>
</body>
</html>
`;
}
fs.writeFileSync(out, page);
console.log(`Wrote ${out} (${Math.round(page.length / 1024)} KB)`);
