// A stand-in for a phone-only native package on desktop (see the list in
// metro.config.js: speech recognition, Health Connect, mDNS, the LAN
// static server, on-device OCR). None of them has a web or desktop
// implementation, and each is reached only from a screen that first
// checks the platform or catches the failure, so what is needed here is a
// module that loads without complaint and does nothing when called.
//
// Every property read off it is a function that returns undefined, and
// that function has the same properties, so `Module.start()`,
// `new Module()`, `useSomeHook(...)` and `Module.Constant.INNER` all
// resolve without throwing. `__esModule` reads true so Babel's default
// import interop takes the `default` branch, and `then` reads undefined
// so an awaited dynamic import settles instead of hanging.

function makeUnavailable(): unknown {
  const target = function unavailable(): undefined {
    return undefined;
  };
  const handler: ProxyHandler<typeof target> = {
    get(_target, property) {
      if (typeof property === 'symbol') {
        return undefined;
      }
      if (property === '__esModule') {
        return true;
      }
      if (property === 'then') {
        return undefined;
      }
      return makeUnavailable();
    },
    apply() {
      return undefined;
    },
    construct() {
      return makeUnavailable() as object;
    },
  };
  return new Proxy(target, handler);
}

module.exports = makeUnavailable();
