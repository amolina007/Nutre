import {cp,rm,writeFile} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});
await cp('public','dist',{recursive:true});
const dev=process.env.BRANCH==='dev'||process.env.NUTRE_ENV==='dev';
await writeFile('dist/env.js',`window.NUTRE_ENV=${JSON.stringify(dev?'dev':'production')};\n`);
await writeFile('dist/robots.txt',dev?'User-agent: *\nDisallow: /\n':'User-agent: *\nAllow: /\n');
if(dev)await writeFile('dist/_headers','/*\n  X-Robots-Tag: noindex, nofollow\n');
console.log('Nutre build:',dev?'dev':'production');
