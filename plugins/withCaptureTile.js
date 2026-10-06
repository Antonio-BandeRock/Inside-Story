// Quick settings tiles for Capture (C12, rebuild R1, 2026-10-02; lock screen
// capture, 1.0.62.1, 2026-10-05).
//
// Two tiles: Voice Note and Photo Note. Direct request, 2026-10-05: "You'd
// pull down the tile ..., enter your Inside Story code, speak, and it saves.
// The phone stays locked the whole time," and the camera's job is "a photo
// straight into Capture."
//
// No Expo module offers a tile, so this plugin writes the services, the two
// small activities behind them, and the tile icons, and registers them:
//
//  - CaptureLauncherActivity decides at the moment of the press. Phone
//    locked and App Lock on: the capture screen over the lock screen.
//    Phone locked and App Lock off: Android's own unlock first, since there
//    is no Inside Story code to ask for, then Capture in the app. Phone
//    unlocked: Capture in the app, listening or with the camera open. The
//    shade buttons (modules/locked-capture) open the same activity.
//  - LockedCaptureActivity is a second React screen in the same app,
//    allowed over the lock screen, showing only the component registered as
//    "LockedCapture" (components/LockedCaptureScreen.tsx). It never shows
//    the app: it asks for the code, takes the note or the photo, seals it
//    (lib/lockedCaptures.ts) and closes. Its own task, so it never appears
//    in the recent apps list and never clears the app's own screens.
//
// Neither activity reads a record. The launcher looks only at whether the
// lock file exists, which is the same thing the app checks before opening
// the database (lib/appLockSession.ts).
const { withAndroidManifest, withDangerousMod, AndroidConfig } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const TILES = [
  { name: '.CaptureTileService', className: 'CaptureTileService', label: 'Voice Note', icon: '@drawable/ic_tile_voice', mode: 'voice' },
  { name: '.CapturePhotoTileService', className: 'CapturePhotoTileService', label: 'Photo Note', icon: '@drawable/ic_tile_photo', mode: 'photo' },
];
const LAUNCHER = '.CaptureLauncherActivity';
const LOCKED = '.LockedCaptureActivity';

function tileSource(pkg, tile) {
  return `package ${pkg}

import android.app.PendingIntent
import android.content.Intent
import android.os.Build
import android.service.quicksettings.Tile
import android.service.quicksettings.TileService

class ${tile.className} : TileService() {
  override fun onStartListening() {
    super.onStartListening()
    qsTile?.let {
      it.state = Tile.STATE_INACTIVE
      it.updateTile()
    }
  }

  override fun onClick() {
    super.onClick()
    val intent = Intent(this, CaptureLauncherActivity::class.java).apply {
      putExtra("mode", "${tile.mode}")
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    if (Build.VERSION.SDK_INT >= 34) {
      val pending = PendingIntent.getActivity(
        this, ${tile.mode === 'voice' ? 1 : 2}, intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
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

function launcherSource(pkg) {
  return `package ${pkg}

import android.app.Activity
import android.app.KeyguardManager
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import java.io.File

class CaptureLauncherActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setShowWhenLocked(true)
    val mode = intent?.getStringExtra("mode") ?: "voice"
    val keyguard = getSystemService(KEYGUARD_SERVICE) as KeyguardManager
    val appLockOn = File(filesDir, "app-lock.json").exists()
    if (keyguard.isKeyguardLocked && appLockOn && mode != "inbox") {
      startActivity(Intent(this, LockedCaptureActivity::class.java).apply {
        putExtra("mode", mode)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
      })
      finish()
      return
    }
    if (keyguard.isKeyguardLocked) {
      keyguard.requestDismissKeyguard(this, object : KeyguardManager.KeyguardDismissCallback() {
        override fun onDismissSucceeded() {
          openCapture(mode)
          finish()
        }
        override fun onDismissCancelled() = finish()
        override fun onDismissError() = finish()
      })
      return
    }
    openCapture(mode)
    finish()
  }

  private fun openCapture(mode: String) {
    val query = when (mode) {
      "voice" -> "?speak=1"
      "photo" -> "?photo=1"
      else -> ""
    }
    startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("hashimotosapp://capture$query")).apply {
      setPackage(packageName)
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    })
  }
}
`;
}

function lockedSource(pkg) {
  return `package ${pkg}

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper

class LockedCaptureActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    setShowWhenLocked(true)
    setTurnScreenOn(true)
    super.onCreate(null)
  }

  override fun getMainComponentName(): String = "LockedCapture"

  override fun createReactActivityDelegate(): ReactActivityDelegate {
    val activity = this
    return ReactActivityDelegateWrapper(
      this,
      BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
      object : DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled) {
        override fun getLaunchOptions(): Bundle =
          Bundle().apply { putString("mode", activity.intent?.getStringExtra("mode") ?: "voice") }
      }
    )
  }
}
`;
}

// Material Symbols mic and photo camera, white, for the tiles and the shade
// buttons (a tile tints its icon itself).
const DRAWABLES = {
  ic_tile_voice: `<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24">
  <path android:fillColor="#FFFFFFFF" android:pathData="M12,14c1.66,0 2.99,-1.34 2.99,-3L15,5c0,-1.66 -1.34,-3 -3,-3S9,3.34 9,5v6c0,1.66 1.34,3 3,3zM17.3,11c0,3 -2.54,5.1 -5.3,5.1S6.7,14 6.7,11L5,11c0,3.41 2.72,6.23 6,6.72L11,21h2v-3.28c3.28,-0.48 6,-3.3 6,-6.72h-1.7z"/>
</vector>
`,
  ic_tile_photo: `<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24">
  <path android:fillColor="#FFFFFFFF" android:pathData="M12,15.2a3.2,3.2 0,1 0,0 -6.4a3.2,3.2 0,1 0,0 6.4z"/>
  <path android:fillColor="#FFFFFFFF" android:pathData="M9,2L7.17,4L4,4c-1.1,0 -2,0.9 -2,2v12c0,1.1 0.9,2 2,2h16c1.1,0 2,-0.9 2,-2L22,6c0,-1.1 -0.9,-2 -2,-2h-3.17L15,2L9,2zM12,17c-2.76,0 -5,-2.24 -5,-5s2.24,-5 5,-5 5,2.24 5,5 -2.24,5 -5,5z"/>
</vector>
`,
};

function withCaptureManifest(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    const pkg = cfg.android?.package;
    const tileNames = TILES.map((tile) => tile.name);
    app.service = (app.service || []).filter((s) => !tileNames.includes(s.$['android:name']));
    for (const tile of TILES) {
      app.service.push({
        $: {
          'android:name': tile.name,
          'android:label': tile.label,
          'android:icon': tile.icon,
          'android:exported': 'true',
          'android:permission': 'android.permission.BIND_QUICK_SETTINGS_TILE',
        },
        'intent-filter': [{ action: [{ $: { 'android:name': 'android.service.quicksettings.action.QS_TILE' } }] }],
      });
    }
    app.activity = (app.activity || []).filter((a) => ![LAUNCHER, LOCKED].includes(a.$['android:name']));
    app.activity.push({
      $: {
        'android:name': LAUNCHER,
        'android:exported': 'false',
        'android:excludeFromRecents': 'true',
        'android:taskAffinity': `${pkg}.capturelauncher`,
        'android:theme': '@android:style/Theme.Translucent.NoTitleBar',
        'android:showWhenLocked': 'true',
      },
    });
    app.activity.push({
      $: {
        'android:name': LOCKED,
        'android:exported': 'false',
        'android:excludeFromRecents': 'true',
        'android:taskAffinity': `${pkg}.lockedcapture`,
        'android:theme': '@style/AppTheme',
        'android:showWhenLocked': 'true',
        'android:turnScreenOn': 'true',
        'android:screenOrientation': 'portrait',
        'android:windowSoftInputMode': 'adjustResize',
        'android:configChanges': 'keyboard|keyboardHidden|orientation|screenLayout|screenSize|smallestScreenSize|uiMode',
      },
    });
    return cfg;
  });
}

function withCaptureSources(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const pkg = cfg.android?.package;
      if (!pkg) throw new Error('withCaptureTile: android.package is not set');
      const root = cfg.modRequest.platformProjectRoot;
      const dir = path.join(root, 'app/src/main/java', ...pkg.split('.'));
      fs.mkdirSync(dir, { recursive: true });
      for (const tile of TILES) fs.writeFileSync(path.join(dir, `${tile.className}.kt`), tileSource(pkg, tile));
      fs.writeFileSync(path.join(dir, 'CaptureLauncherActivity.kt'), launcherSource(pkg));
      fs.writeFileSync(path.join(dir, 'LockedCaptureActivity.kt'), lockedSource(pkg));
      const drawables = path.join(root, 'app/src/main/res/drawable');
      fs.mkdirSync(drawables, { recursive: true });
      for (const [name, xml] of Object.entries(DRAWABLES)) fs.writeFileSync(path.join(drawables, `${name}.xml`), xml);
      return cfg;
    },
  ]);
}

module.exports = function withCaptureTile(config) {
  return withCaptureSources(withCaptureManifest(config));
};
