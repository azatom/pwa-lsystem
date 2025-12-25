import lsystemSvg from './lsystem-svg.js';
(
  (e, s = e.target) => (
    onhashchange = e => lsystemSvg(
      decodeURIComponent(location.href.split(/[?#]/)[1]),
      s
    )
  )()
)(event);