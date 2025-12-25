export default async function lsystemSvg(R = 'S=SF+SF-SF', svg, pleaseStop) {
  R = 'string' === typeof R ? Object.fromEntries(R
    .replace(/&/g, ',').replace(/([^,:=]*)[:=]([^,:=]*)/g, '$1=$2')
    .split(',').map(a => a.split('='))) : R;
  let T = performance.now(), [x, y, a, b, q, cnt] = Array(9).fill(0), d = '', p = 1, i, j, Q = Math.PI / 2;
  R.S ??= 'F';
  R._n = R._n | 0;
  R._a = R._a ? R._a === 'q' ? 180 * (3 - Math.sqrt(5)) : R._a : 90;
  R._l ??= 9;
  R._m ??= Q;
  const O = (v, a) => v == null || v === '' ? a : v, z = [], B = R._a / 90
    , Z = Object.fromEntries(Object.entries(R).filter(([k]) => k.endsWith('2')).map(([k, v]) => [k[0], v]))
    , o = a => +parseFloat(a).toPrecision(12)
    , f = f => R._l * Math.pow(R._m, q) * f(Q * (a * B + b))
    , C = (t, a, ...b) => {
      t = document.createElementNS('http://www.w3.org/2000/svg', t);
      for (i in a) t.setAttribute(i, a[i]);
      b?.map(b => t.prepend(b));
      return t;
    }, grid = {}, D = ((E = 1e-5, F = 9 * E) => {
      let lines = new Set(), [px, py] = align(x, y), pxy = `${px},${py}`, dxy
        , mx = 1 / 0, Mx = -1 / 0, my = mx, My = Mx, _min = mx, _max = Mx;
      function oo(s) { return s.split(',').map(o).join(','); }
      function align(X, Y) {
        let D = Infinity, P, ps, p, d, i, j, k
          , x = Math.floor(X / F), y = Math.floor(Y / F), e = Math.ceil(E / F);
        for (j = -e; j <= e; j++) for (i = -e; i <= e; i++) {
          ps = grid[`${x + i},${y + j}`];
          if (ps) for (k = 0; k < ps.length; k++) {
            p = ps[k]; d = Math.hypot(p[0] - X, p[1] - Y); if (d < D) { D = d; P = p; }
            _max < d && d < E && (_max = d); E < d && d < _min && (_min = d);
          }
        }
        if (D >= E) (grid[`${x},${y}`] ??= []).push(P = [X, Y]);
        return P;
      }
      return {
        stat: function (ts = a => a >= 1e6 ? (a / 1e6).toFixed(6) : a,
          dots = Object.values(grid).reduce((p, c) => p + c.length, 0)) {
          return {
            err: dots - Object.keys(grid).length, ms: +(performance.now() - T).toFixed(3), B: ts(cnt),
            lg: Math.log(_max) | 0, len: _min.toExponential(2), dot: ts(dots), line: ts(lines.size),
          };
        },
        vb: function (m) { return [mx - m, my - m, Mx - mx + 2 * m, My - my + 2 * m]; },
        put: function (x, y, L) {
          let XY = align(x, y);[x, y] = XY; let xy = `${x},${y}`;
          if (L) {
            const l = pxy < xy ? `${pxy},${xy}` : `${xy},${pxy}`;
            if (!lines.has(l)) {
              lines.add(l);
              if (pxy !== dxy) d += `M${oo(pxy)}`;
              d += ` ${oo(dxy = xy)}`;
              mx = Math.min(x, px, mx); Mx = Math.max(x, px, Mx);
              my = Math.min(y, py, my); My = Math.max(y, py, My);
            }
          }
          pxy = xy; px = x; py = y;
          return XY;
        },
      };
    })();
  let id = [0, 1].map(_ => 'id' + Math.random().toString(36).slice(2)), ir;
  const step = _ =>
    'F' === i || 'f' === i ? [x, y] = D.put(x + f(Math.cos), y + f(Math.sin), 'F' === i) :
    '+' === i ? a += p : '*' === i ? q++ : '|' === i ? b = (b + 0 + 2) % 4 :
    '-' === i ? a -= p : '/' === i ? q-- : '^' === i ? b = (b + p + 4) % 4 :
    '!' === i ? p = -p :
    '[' === i ? z.push([x, y, a, b, q]) :
    ']' === i ? z.length && ([x, y, a, b, q] = z.pop(), D.put(x, y)) : 0;

  const ver = 1;

  if (0 === ver) {
    for (i of function* g(n) { if (n > 0) for (j of g(n - 1)) yield* (Z && n === R._n ? Z : R)?.[j] ?? j; else yield* R.S; }(R._n)) {
      ++cnt;
      if (pleaseStop && cnt % 1e4 === 0 && (ir = await pleaseStop(cnt))) break;
      step();
    }
  }

  if (1 === ver) {
    const ai = Array(2 + R._n).fill(0), ar = ai.map(() => [])
      , next = (n, c) => {
        while (true) {
          if (ai[n] < ar[n].length) return ar[n][ai[n]++];
          if (!n || !(c = next(n - 1))) return 0;
          ar[n] = (Z && n === R._n ? Z : R)[c] ?? c;
          ai[n] = 0;
        }
      };
    ar[0] = R.S;
    while (i = next(R._n)) {
      ++cnt;
      if (pleaseStop && cnt % 1e4 === 0 && (ir = await pleaseStop(cnt))) break;
      step();
    }
  }

  [x, y, a, b] = d.length ? D.vb(O(R._z, 2)).map(o) : [0, 0, 0, 0];
  let P = +O(R._j, 0) * 4 + +O(R._k, 0);
  svg ||= C('svg');
  svg.setAttribute('viewBox', `${O(R._x, x)} ${O(R._y, y)} ${O(R._w, a)} ${O(R._h, b)}`);
  svg.setAttribute('stroke-opacity', `${O(R._o, 1)}`);
  svg.replaceChildren(
    R._min ? '' : (t => (t.textContent = (ir ?? '') + O(R[''], ''), t))(C('title')),
    R._min ? '' : (t => (t.textContent = JSON.stringify({ stat: D.stat(), R }), t))(C('desc')),
    C('rect', { stroke: `${O(R._cb, '#fff')}`, fill: `${O(R._cb, '#fff')}`, x, y, width: a, height: b }),
    R._k ? C('defs', 0,
      C('marker', {
        id: id[0],
        markerWidth: 2 * P,
        markerHeight: 2 * P,
        viewBox: `${-P} ${-P} ${2 * P} ${2 * P}`,
      }, C('circle', {
        r: O(R._k, 1),
        fill: O(R._cd, '#000'),
        style: R._j ? `filter:blur(${R._j}px)` : ''
      }))
    ) : '', R._hand ? C('filter', { id: id[1], x: '-20%', y: '-20%', width: '140%', height: '140%', filterUnits: 'objectBoundingBox', primitiveUnits: 'userSpaceOnUse', 'color-interpolation-filters': 'linearRGB' },
      C('feGaussianBlur', { stdDeviation: '0.15' }),
      C('feDisplacementMap', { in: 'SourceGraphic', in2: 'turbulence', scale: '6', xChannelSelector: 'G', yChannelSelector: 'A', result: 'displacementMap' }),
      C('feTurbulence', { type: 'turbulence', baseFrequency: '0.03 0.03', numOctaves: '3', seed: '1', stitchTiles: 'noStitch', result: 'turbulence' }),
    ) : '', C('path', {
      stroke: O(R._cc, '#000'),
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      fill: 'none',
      ...R._hand ? { filter: `url(#${id[1]})` } : {},
      ...R._k && ['start', 'mid', 'end'].reduce((p, c) => (p['marker-' + c] = `url(#${id[0]})`, p), {}),
      d
    }),
  );
  return svg;
}