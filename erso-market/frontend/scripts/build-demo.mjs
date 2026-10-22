// Builds the demo (shop + admin running on an in-browser fake API) into one
// self-contained HTML file: dist-demo/erso-market-demo.html. Handy for showing the
// shop to someone without a server.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

execSync('npx vite build --mode demo', { stdio: 'inherit' });

const dir = 'dist-demo';
const assets = join(dir, 'assets');
const files = readdirSync(assets);
const css = files.filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(assets, f), 'utf8')).join('\n');
const js = files.filter((f) => f.endsWith('.js')).map((f) => readFileSync(join(assets, f), 'utf8')).join('\n');
const favicon = `data:image/png;base64,${readFileSync('public/favicon.png').toString('base64')}`;

const html = `<title>ERSO Market</title>
<meta name="description" content="Demo e ERSO Market: makina, motorra, pajisje dhe makineri direkt nga fabrikat në Kinë.">
<link rel="icon" href="${favicon}">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600&family=Manrope:wght@400;500;600;700&display=swap">
<style>${css}</style>
<div id="root"></div>
<script type="module">${js.replace(/<\/script/gi, '<\\/script')}</script>
`;
writeFileSync(join(dir, 'erso-market-demo.html'), html);
console.log(`dist-demo/erso-market-demo.html (${Math.round(html.length / 1024)} KB)`);
