## LSystem.svg - Logo Turtle with Context-Free Grammar - Lindenmayer System Fractals
### Just click **`all examples`** / **`next e.g.`** buttons.
- Standalone editor html/PWA: [html#...](lsystem.html#=Hilbert,S=-!S!F+SFS+F!S!-,_a=90,_l=2,_n=4,_z=1.5)
- Standalone SVG file: [svg#...](lsystem.svg#S=AX,X=F+F+F+FFF-F-F-F,F=,A=[+AX-AX-AX]-AX+AX+AX-,_a=60,_n=3)
- Re-formatting rules (e.g. after pasting): `Update` (Triangle) or `Ctrl+Enter`
- Buttons with alternative feautres: press `shift` key or 'long click'
- Manual save: `export` / `url editor` than bookmark it
- Auto save: last valid rules
- MobileZoom: onefingered tap-tap-drag,  desktop: scroll or +-
- Practical usage:) look for button images in source

### How It Works:
- Start with a sentence 'S'
- Each iteration replaces characters in the sentence using key-value rules
- The resulting sentence instructs Logo turtle which direction to turn, how far to move, and whether to draw its path

### Syntax:
- Rules separated by `,`, `&`, or `\n` (newline)
- Rule key-value pairs separated by `=` or `:`
- Editor and svg accepts URLfragment `#` and QueryParameters `?`

### Keys:
- Single character: A rule (e.g., `F`, `A`)
- Single character + `2`: Alternative rule for 1 additional iteration
- Empty key: Page title

### Values:
- `S`: Starting sentence
- `F`, `f`: Move forward with/without drawing
- `+`, `-`, `^`, `|`: Rotate +`_a`, -`_a`, +90°, 180°
- `!`: Toggle rotation (`+-^`) parity (swaps left and right)
- `*`, `/`: Multiply/divide line length by `_m`
- `[`, `]`: Push/pop stack (save/restore) of (position, length, direction)
- Empty value: Use calculated or default value, (mostly) same as key is not presented

### Numbers, range:
- `_n`: Number of iterations, `0+`
- `_m`: Line length multiplier, `+`
- `_a`: Angle in degrees, `-0+`
- `_l`: Initial line length width=1, `+`
- `_k`: Dot size, `0+`
- `_j`: Dot blur, `0+`
- `_o`: Stroke-opacity, `0..1`
- `_cb`: Color background, `#[0-9a-f]{3,8}`
- `_cc`: Color line, `#[0-9a-f]{3,8}`
- `_cd`: Color dot, `#[0-9a-f]{3,8}`
- `_x`, `_y`, `_w`, `_h`: ViewBox, `-0+`
- `_z`: Padding, `0+`

### Generated SVG
- Retains zoom level
- Includes rules and statistics in its description

### Build (optional):
- Serve on http protocol from `src` folder, https for PWA with additional files: manifest,sw.js,icon,README from "root"
- Or `npm i; npm run build` for:
  - a standalone html file
  - the svg actually is builded

### Some fibonacci:
```
f(0) = 0
f(n) = a*f(n-1) + b*f(n-2)
i     1  2  3  4  5  6  7
x     2  3  5  6  7  8 10
a     2  4  4 10 16  6
b    +1 -1 +1 -1 -1 -1
f(1)  2  3  4  2  3  2
x = i + round(√i)
```