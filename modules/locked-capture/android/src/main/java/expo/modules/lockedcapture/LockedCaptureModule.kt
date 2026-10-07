package expo.modules.lockedcapture

import android.content.Context
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// What the JavaScript side needs for capturing over the lock screen
// (1.0.62.1): closing the capture screen when it is done, and the
// shade buttons' switch in Profile.
class LockedCaptureModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("No React context")

  override fun definition() = ModuleDefinition {
    Name("LockedCapture")

    // Only ever closes the lock screen capture activity, never the app.
    Function("finishCapture") {
      val activity = appContext.currentActivity
      if (activity != null && activity.javaClass.simpleName == "LockedCaptureActivity") activity.finish()
    }

    Function("showShadeButtons") { ShadeButtons.show(context) }

    Function("hideShadeButtons") { ShadeButtons.hide(context) }

    Function("isShowingShadeButtons") { ShadeButtons.isShowing(context) }

    Function("showEmergencyNotice") { title: String, body: String -> EmergencyNotice.show(context, title, body) }

    Function("hideEmergencyNotice") { EmergencyNotice.hide(context) }
  }
}
