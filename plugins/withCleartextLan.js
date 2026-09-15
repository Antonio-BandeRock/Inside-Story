const { withAndroidManifest } = require('expo/config-plugins');

// Sets android:usesCleartextTraffic="true" on the <application> tag.
//
// Sync over Wi-Fi (lib/lanSync.ts) has one phone fetch from the other over
// plain HTTP on the local network: there is no certificate a phone could
// hold for a LAN address, so HTTPS is not an option there. Android 9 and
// later block every cleartext request unless the app opts in, and React
// Native reports the block as the bare "Network request failed", which is
// exactly what both phones showed on 2026-09-14 the first time two paired
// partners tried it (the phones found each other over mDNS; the fetch that
// followed was refused before it left the phone).
//
// Everything else the app talks to is https (the App Link host, EAS
// updates, Firebase), so the only traffic this widens to cleartext is the
// sealed partner files, which are encrypted before they are served.
// Android's network_security_config cannot scope cleartext to an address
// range (only to named domains), so the application-wide attribute is the
// one lever there is.
//
// Requires a native rebuild; this edits AndroidManifest.xml.
const withCleartextLan = (config) => {
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application?.[0];
    if (application) {
      application.$['android:usesCleartextTraffic'] = 'true';
    }
    return config;
  });
};

module.exports = withCleartextLan;
