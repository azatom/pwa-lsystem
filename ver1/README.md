#  Logo Turtle with Context Free grammar - L-System fractals

##  Example:
`lsystem.svg?S=AX&X=F+F+F+FFF-F-F-F&F=&A=[+AX-AX-AX]-AX+AX+AX-&_a=60&_n=3`

One svg file [lsystem.svg](lsystem.svg) and a [big collection](lsystem.examples.html)

##  How it works:
Starting sentence (axiom) is 'S'. In an iteration every character of the sentence replaced by the key-value rule set. A key's default value is the key itself. The resulted sentence says to the logo turtle what to do.

Note: embeding this svg with `<img>` does not work, only with `<object>` or '<embed>'.

##  Parameter key - value pairs:
when key starts with an `_`, than value is a number
- `_n` - iterations
- `_l` - initial length of line (width=1)
- `_m` - multiply linelength
- `_a` - angle in degrees
- (1char) - a rule
- (empty key) - title 
- (chars) - invalid, Context Sensitive grammar is not implemented

##  Characters of rule value:
- `F`/`f`: forward with, without drawing a line
- `+`, `-`, `^`, `|`: rotate _a, -_a, right, straight
- `!`: change parity of rotation
- `*`, `/`: multiply, divide length of line with m
- `[`, `]`: state (position, line length and direction) store, load

##  Some fibonacci:
```
  2; 2,5,12,29,70,169,408,985,2378; 2a(n-1)+a(n-2)
  3; 4,15,56,209,780,2911;          4a(n-1)-a(n-2)
  5; 4,17,72,305,1292;              4a(n-1)+a(n-2)
  6; 2,20,198,1960;                10a(n-1)-a(n-2)
  7; 3,48,765;                     16a(n-1)-a(n-2)
  8; 6,35,204,1189;                 6a(n-1)-a(n-2)
  10;
```
