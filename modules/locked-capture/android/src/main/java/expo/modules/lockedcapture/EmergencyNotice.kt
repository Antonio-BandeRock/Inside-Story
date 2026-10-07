package expo.modules.lockedcapture

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import org.json.JSONObject
import java.io.File

// The emergency lines on the lock screen, posted from here rather than by
// expo-notifications (2026-10-07). Direct request: "make the Emergency card
// be a notification that can be selected like the voice note or photo so the
// emergency information can be displayed if selected from the notifications
// too." A tap on it opens CaptureLauncherActivity in mode "emergency", which
// shows the lines over the lock screen in large type, with the phone and the
// app both still locked.
//
// What it shows comes from emergency-lock-screen.json in the app's files,
// written by lib/emergencyLockScreen.ts and holding only the lines the person
// picked to be readable on a locked phone, so the notice can be put back
// after a restart and read by that screen without the database key.
object EmergencyNotice {
  private const val CHANNEL_ID = "emergency-lock-screen"
  private const val NOTIFICATION_ID = 61018
  const val FILE_NAME = "emergency-lock-screen.json"

  private fun drawable(context: Context, name: String, fallback: Int): Int {
    val id = context.resources.getIdentifier(name, "drawable", context.packageName)
    return if (id != 0) id else fallback
  }

  /** Posts the notice. False when Android will not show notifications. */
  fun show(context: Context, title: String, body: String): Boolean {
    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (!manager.areNotificationsEnabled()) return false
    manager.createNotificationChannel(
      NotificationChannel(CHANNEL_ID, "Emergency lines on the lock screen", NotificationManager.IMPORTANCE_LOW).apply {
        description = "The emergency lines you picked in Life > Emergency, readable while the phone is locked."
        setShowBadge(false)
        setSound(null, null)
        enableVibration(false)
        lockscreenVisibility = Notification.VISIBILITY_PUBLIC
      }
    )
    val intent = Intent().apply {
      setClassName(context, "${context.packageName}.CaptureLauncherActivity")
      putExtra("mode", "emergency")
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    val open = PendingIntent.getActivity(
      context, 4, intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
    )
    val notification = Notification.Builder(context, CHANNEL_ID)
      .setSmallIcon(drawable(context, "notification_icon", android.R.drawable.ic_dialog_info))
      .setContentTitle(title)
      .setContentText(body)
      .setStyle(Notification.BigTextStyle().bigText(body))
      .setContentIntent(open)
      .setOngoing(true)
      .setShowWhen(false)
      .setOnlyAlertOnce(true)
      .setVisibility(Notification.VISIBILITY_PUBLIC)
      .setGroup("inside-story-emergency")
      .build()
    manager.notify(NOTIFICATION_ID, notification)
    return true
  }

  fun hide(context: Context) {
    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    manager.cancel(NOTIFICATION_ID)
  }

  /** After a restart: puts the notice back from the file, when there is one. */
  fun restore(context: Context) {
    try {
      val file = File(context.filesDir, FILE_NAME)
      if (!file.exists()) return
      val json = JSONObject(file.readText())
      val title = json.optString("title")
      val body = json.optString("body")
      if (title.isNotEmpty() && body.isNotEmpty()) show(context, title, body)
    } catch (_: Exception) {
      // An unreadable file is put right the next time the app opens.
    }
  }
}
