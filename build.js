#!/usr/bin/env node
import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { minify } from 'terser';

const srcHtml = 'src/lsystem.html';
const outSrcSvg = 'src/lsystem.svg';
const outSvg = 'lsystem.svg';
const outHtml = 'index.html';
const srcs = [{
  entryPoints: ['src/lsystem.js'],
  format: 'iife',
}, {
  entryPoints: ['src/lsystem.svg.onload.js'],
  format: 'esm',
  minify: true,
}, {
  entryPoints: ['src/lsystem-onloadForCDATA.js'],
  format: 'esm',
  minify: true,
}, {
  entryPoints: ['src/lsystem-lsForCDATA.js'],
  format: 'esm',
  minify: true,
}, {
  entryPoints: ['src/lsystem.css'],
}]

const failOnWarning = async (options) => {
  options = {
    write: false,
    bundle: true,
    minify: true,
    ...options
  };
  const result = await build(options);
  [...result.warnings, ...result.errors]
    .map(e => console.error(e.text))
    .some(() => process.exit(1));
  return options?.minify
    ? result.outputFiles[0].text.trim()
    : result.outputFiles[0].text;
};
const terseropts = {
  compress: {
    defaults: true,
    dead_code: true,
    booleans: true,
    conditionals: true,
  },
  format: { quote_style: 1, },
  mangle: true,
};

const [js, onload, onloadForCDATA, lsForCDATA, css] = await Promise.all(srcs.map(failOnWarning));
const [js2, onload2, onloadForCDATA2, lsForCDATA2] = (await Promise.all([js, onload, onloadForCDATA, lsForCDATA].map(a => minify(a, terseropts)))).map(a=>a.code);

const html = (await readFile(srcHtml, 'utf8'))
  .replace(/<script[^>]*src="lsystem\.js"[^>]*><\/script>/, `<script>${js2}</script>`)
  .replace(/<link[^>]*href="lsystem\.css"[^>]*>/, `<style>${css}</style>`);

const esc = s => s
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/"/g, '&quot;');

const onload3 = esc(onload2);

if (/\n|\r/.test(onload3)) throw new Error('newline');

// const svg = `<svg onload="${onload3}" xmlns="http://www.w3.org/2000/svg"></svg>`;
const svg = `<svg onload="${esc(onloadForCDATA2)}" xmlns="http://www.w3.org/2000/svg"><script>/*<![CDATA[*/${lsForCDATA2}//]]></script></svg>`;

const writeIfChanged = async (filename, data) => {
  let buf = Buffer.from(data), old, res = '-';
  try { old = await readFile(filename); }
  catch (e) { if (e !== 'ENOENT') throw e; }
  if (!old || buf.compare(old)) { await writeFile(filename, buf); res = '+'; }
  console.log(`${res} ${filename}  ${buf.length<old.length?'':'+'}${buf.length-old.length}/${buf.length}`);
};

[
  [outSrcSvg, svg], // standalone svg
  [outSvg, svg], // optional dupe for html
  [outHtml, html], // optional standalone html file
].map(e => writeIfChanged(...e));

const readme1 = 'README.md';
const readme2 = 'src/README.md';
const { statSync } = await import('node:fs');
try {
  const readme1Content = await readFile(readme1, 'utf8').catch(() => '');
  const readme2Content = await readFile(readme2, 'utf8').catch(() => '');
  if (readme1Content !== readme2Content) {
    if (statSync(readme1).mtime < statSync(readme2).mtime) {
      await writeIfChanged(readme1, readme2Content);
    } else {
      console.error('error: You must edit README.md in src!');
    }
  }
} catch (e) {
  console.error(`error:  Could not check file dates: ${e.message}`);
}

