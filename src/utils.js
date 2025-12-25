const mc = new MessageChannel();
export function yieldOnce() {
  return new Promise((resolve) => {
    mc.port1.onmessage = () => (mc.port1.onmessage = null, resolve());
    mc.port2.postMessage(null);
  });
}

export function toggleCustomLog(enable, customLog, _ = console) {
  if (typeof customLog === "function") {
    _.oldLog ??= _.log;
    _.customLog = customLog;
  }
  if (_.oldLog && _.customLog) {
    _.log = enable ? _.customLog : _.oldLog;
  }
}

export async function wrappedRun(acHolder, progress, fn, arg) {
  let ac;
  try {
    let pleaseStop;
    if (acHolder) {
      acHolder.abortController?.abort();
      acHolder.abortController = ac = new AbortController();
      progress(0);
      await yieldOnce();
      pleaseStop = async (n) => {
        if (ac.signal.aborted) return acHolder.interrupted;
        progress(n);
        await yieldOnce();
        return void 0;
      };
    }
    return await fn(arg, void 0, pleaseStop);
  } catch (e) {
    acHolder && progress(e.message || strings.error);
  } finally {
    acHolder && acHolder.abortController === ac && (acHolder.abortController = null);
  }
}

export async function setupHtmlBase() {
  const base = window.location.pathname.replace(/\/*([a-z]+\.html)?$/, "/");
  document.head.insertBefore(Object.assign(
    document.createElement('base'),
    { href: base }
  ), document.head.firstChild);
  return base;
}

export async function installServiceWorker(sw, base) {
  try {
    const reg = await window.navigator.serviceWorker.register(sw);
    const mc = new MessageChannel();
    mc.port1.onmessage = ev => {
      try {
        ev.data && ev.data.version && console.log(location.host || location.origin, (window.lsystemVersion = ev.data.version));
      } catch (e) { console.log('port1 onmessage error', e); }
    };
    const target = reg.active || reg.waiting || reg.installing;
    if (target && typeof target.postMessage === 'function') {
      target.postMessage({ type: 'getVersion' }, [mc.port2]);
    } else if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'getVersion' }, [mc.port2]);
    }
  } catch (e) {
    console.log('serviceWorker register/message failed', e);
  }
};
