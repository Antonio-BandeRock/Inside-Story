// A quick settings tile that opens Capture (C12, rebuild R1, 2026-10-02).
// Pull down the notification shade, tap "Capture", and the capture screen
// opens with the field ready, the same as the app icon's Capture shortcut.
// No Expo module offers a tile, so this plugin writes one small TileService
// and registers it. The tile only opens a link the app already handles
// (hashimotosapp://capture); it reads nothing and records nothing itself.
const { withAndroidManifest, withDangerousMod, AndroidConfig } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const SERVICE = '.CaptureTileService';

function tileSource(pkg) {
  return `package ${pkg}

import android.app.PendingIntent
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.service.quicksettings.Tile
import android.service.quicksettings.TileService

class CaptureTileService : TileService() {
  override fun onStartListening() {
    super.onStartListening()
    qsTile?.let {
      it.state = Tile.STATE_INACTIVE
      it.updateTile()
    }
  }

  override fun onClick() {
    super.onClick()
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("hashimotosapp://capture")).apply {
      setPackage(packageName)
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    if (Build.VERSION.SDK_INT >= 34) {
      val pending = PendingIntent.getActivity(
        this, 0, intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
      )
      startActivityAndCollapse(pending)
    } else {
      @Suppress("DEPRECATION")
      startActivityAndCollapse(intent)
    }
  }
}
`;
}

function withTileManifest(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    app.service = (app.service || []).filter((s) => s.$['android:name'] !== SERVICE);
    app.service.push({
      $: {
        'android:name': SERVICE,
        'android:label': 'Capture',
        'android:icon': '@drawable/notification_icon',
        'android:exported': 'true',
        'android:permission': 'android.permission.BIND_QUICK_SETTINGS_TILE',
      },
      'intent-filter': [{ action: [{ $: { 'android:name': 'android.service.quicksettings.action.QS_TILE' } }] }],
    });
    return cfg;
  });
}

function withTileSource(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const pkg = cfg.android?.package;
      if (!pkg) throw new Error('withCaptureTile: android.package is not set');
      const dir = path.join(cfg.modRequest.platformProjectRoot, 'app/src/main/java', ...pkg.split('.'));
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'CaptureTileService.kt'), tileSource(pkg));
      return cfg;
    },
  ]);
}

module.exports = function withCaptureTile(config) {
  return withTileSource(withTileManifest(config));
};
