import { strings } from './strings.js';

export function getRules(s) {
  return Object.fromEntries(s
    .replace(/[\n\r&]+/g, ',')
    .replace(/(^[?#{}]|[}]$|[\r \t\s\u00A0]+)/g, '')
    .split(',')
    .filter(a => a !== '')
    .map(a => a.split(/[=:]/))
    .map(a => { if (a.length != 2) throw new Error(strings.shorthelp); return a; })
    .map(a => a.map(a => a.replace(/(^["']|["']$)/g, '')))
    .map(([k, v]) => { if (!/^(|[^"']|_[^"']+|[^"']2)$/.test(k) && /[^"']*/.test(v)) throw new Error(strings.shorthelp); return [k, v]; })
  );
}

export function addDefaults(R, s) {
  return {
    ...R,
    // _j: 0, _k: 0,
    // _o: 1,
    // _l: 9,
    // _x: '', _y: '', _w: '', _h: '', _z: '',
    // _cd: '#000', _cc: '#000', _cb: '#fff',
    ...getRules(s),
  };
}

export function addVb(s, vb) {
  return {
    ...getRules(s),
    ...vb,
  };
}

export function stringify(rR, isHtml) {
  if (typeof rR === 'string') rR = getRules(rR);
  const p = p => p
    .replace(/^S/, ' S')
    .replace(/^_w/, '_y2')
    .replace(/^_h/, '_y3')
    .replace(/^_/, 'zz')
    , sortKeys = (a, b) => a.length - b.length || p(a).localeCompare(p(b));
  return Object.keys(rR = 'string' == typeof rR ? getRules(rR) : rR)
    .sort(sortKeys)
    .map(k => isHtml ? `<p>${k}=${rR[k]}</p>` : `${k}=${rR[k]}`)
    //.map(k => isHtml ? `<p><em>${k}</em>=${rR[k]}</p>` : `${k}=${rR[k]}`)
    .join(isHtml ? '' : ',');
}
