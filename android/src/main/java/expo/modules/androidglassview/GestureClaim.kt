package expo.modules.androidglassview

import android.view.MotionEvent
import android.view.View
import android.view.ViewConfiguration
import com.facebook.react.uimanager.events.NativeGestureUtil
import kotlin.math.abs

/**
 * Takes a horizontal drag away from scrolling parents (and React Native's JS responders) once it
 * is clearly horizontal, the way a slider in a scroll view behaves. A drag that turns out vertical
 * first is left to the parent, which then cancels this view's gesture.
 */
internal class GestureClaim(private val view: View) {
  private val touchSlop = ViewConfiguration.get(view.context).scaledTouchSlop
  private var startX = 0f
  private var startY = 0f
  private var claimed = false

  /** Whether this gesture has been claimed. Feed [onEvent] every event of the gesture. */
  val isClaimed: Boolean get() = claimed

  fun onEvent(event: MotionEvent) {
    when (event.actionMasked) {
      MotionEvent.ACTION_DOWN -> {
        startX = event.x
        startY = event.y
        claimed = false
      }
      MotionEvent.ACTION_MOVE -> if (!claimed) {
        val dx = abs(event.x - startX)
        val dy = abs(event.y - startY)
        if (dx > touchSlop && dx > dy) {
          claimed = true
          view.parent?.requestDisallowInterceptTouchEvent(true)
          runCatching { NativeGestureUtil.notifyNativeGestureStarted(view, event) }
        }
      }
      MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
        if (claimed) runCatching { NativeGestureUtil.notifyNativeGestureEnded(view, event) }
        claimed = false
      }
    }
  }
}

/** Right-to-left layout (Arabic, Hebrew, …): the controls mirror. */
internal val View.isRtl: Boolean get() = layoutDirection == View.LAYOUT_DIRECTION_RTL
