package expo.modules.lockedcapture

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

// The Capture buttons kept in the notification shade (1.0.62.1). Direct
// request, 2026-10-05: "tap a button on a notification you keep in the
// shade, enter your Inside Story code, speak, and it saves."
//
// Each button opens CaptureLauncherActivity, written into the app by
// plugins/withLockedCapture.js, which decides at the moment of the press:
// over the lock screen when the phone is locked and App Lock is on, the
// phone's unlock first when App Lock is off, and straight into Capture
// when the phone is already unlocked. Voice Control (1.0.66.13) always asks
// for the phone's unlock first and then opens the app listening for a
// command, since it works the app's screens. The notification carries no words
// from anybody's records, so it is safe to show on the lock screen.
//
// One notification per button, each opened by a tap on itself, rather than one with
// two buttons (2026-10-07). Samsung's shade sends every press of a
// notification BUTTON that opens a screen through the phone's unlock
// first, whatever that screen allows; a tap on the notification itself goes
// straight to a screen that may show over the lock screen. Seen in the
// phone's log as dismissKeyguardThenExecute on each button press.
object ShadeButtons {
  private const val PREFS = "inside_story_locked_capture"
  private const val KEY_ON = "shade_buttons"
  private const val CHANNEL_ID = "capture-buttons"
  private const val NOTIFICATION_ID = 61016
  private const val PHOTO_NOTIFICATION_ID = 61017
  private const val COMMAND_NOTIFICATION_ID = 61018
  const val ACTION_DISMISSED = "expo.modules.lockedcapture.SHADE_BUTTONS_DISMISSED"

  fun isOn(context: Context): Boolean =
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean(KEY_ON, false)

  private fun setOn(context: Context, on: Boolean) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putBoolean(KEY_ON, on).apply()
  }

  private fun launcher(context: Context, mode: String, requestCode: Int): PendingIntent {
    val intent = Intent().apply {
      setClassName(context, "${context.packageName}.CaptureLauncherActivity")
      putExtra("mode", mode)
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    return PendingIntent.getActivity(
      context, requestCode, intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
    )
  }

  private fun drawable(context: Context, name: String, fallback: Int): Int {
    val id = context.resources.getIdentifier(name, "drawable", context.packageName)
    return if (id != 0) id else fallback
  }

  /** Posts the buttons and remembers they are wanted. False when Android will not show them. */
  fun show(context: Context): Boolean {
    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (!manager.areNotificationsEnabled()) return false
    setOn(context, true)
    manager.createNotificationChannel(
      NotificationChannel(CHANNEL_ID, "Capture buttons", NotificationManager.IMPORTANCE_LOW).apply {
        description = "Voice Note, Photo and Voice Control buttons kept in the shade."
        setShowBadge(false)
        lockscreenVisibility = Notification.VISIBILITY_PUBLIC
      }
    )
    val small = drawable(context, "notification_icon", android.R.drawable.ic_btn_speak_now)
    val dismissed = PendingIntent.getBroadcast(
      context, 3,
      Intent(context, ShadeButtonsReceiver::class.java).setAction(ACTION_DISMISSED),
      PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
    )
    fun post(id: Int, iconName: String, title: String, text: String, mode: String, requestCode: Int) {
      val notification = Notification.Builder(context, CHANNEL_ID)
        .setSmallIcon(drawable(context, iconName, small))
        .setContentTitle(title)
        .setContentText(text)
        .setContentIntent(launcher(context, mode, requestCode))
        .setDeleteIntent(dismissed)
        .setOngoing(true)
        .setShowWhen(false)
        .setOnlyAlertOnce(true)
        .setVisibility(Notification.VISIBILITY_PUBLIC)
        // A group of its own keeps Android from folding it in with the
        // reminders, where it would sit one tap further away.
        .setGroup("inside-story-capture-$mode")
        .build()
      manager.notify(id, notification)
    }
    post(NOTIFICATION_ID, "ic_tile_voice", "Voice Note", "Tap to say a note into Capture.", "voice", 1)
    post(PHOTO_NOTIFICATION_ID, "ic_tile_photo", "Photo", "Tap to take a photo into Capture.", "photo", 2)
    // 3 is the dismissed broadcast above.
    post(COMMAND_NOTIFICATION_ID, "ic_tile_command", "Voice Control", "Tap to unlock and give a command.", "command", 4)
    return true
  }

  fun hide(context: Context) {
    setOn(context, false)
    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    manager.cancel(NOTIFICATION_ID)
    manager.cancel(PHOTO_NOTIFICATION_ID)
    manager.cancel(COMMAND_NOTIFICATION_ID)
  }

  /** Whether the buttons are in the shade now, rather than only wanted. */
  fun isShowing(context: Context): Boolean {
    if (!isOn(context)) return false
    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    return manager.activeNotifications.any { it.id == NOTIFICATION_ID }
  }

  /** Swiped away (Android 14 and later allow it): no longer wanted, so the switch reads off. */
  fun dismissed(context: Context) = setOn(context, false)
}

class ShadeButtonsReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    when (intent.action) {
      ShadeButtons.ACTION_DISMISSED -> ShadeButtons.dismissed(context)
      Intent.ACTION_BOOT_COMPLETED, Intent.ACTION_MY_PACKAGE_REPLACED -> {
        if (ShadeButtons.isOn(context)) ShadeButtons.show(context)
        EmergencyNotice.restore(context)
      }
    }
  }
}
