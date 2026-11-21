package expo.modules.androidglassview

import android.animation.ArgbEvaluator
import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.os.Build
import android.view.MotionEvent
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

/**
 * A glass switch, after Kyant's LiquidToggle (Backdrop Catalog sample, Apache 2.0): a 64×28dp
 * track that fades from the track colour to the accent colour, and a 40×24dp thumb that is white
 * at rest and turns into a liquid glass lens (swelling ×1.5) while pressed.
 *
 * The whole switch takes touches: a tap flips it; a drag moves the thumb (20dp travel) and the
 * release snaps to the nearer side; a cancelled gesture returns to the current value.
 * Left-to-right only for now.
 *
 * Below 37.2, the pressed thumb's lens bends the named `backdropSource` (and the track); without a
 * source it bends only the track.
 */
class AndroidGlassToggle(context: Context, appContext: AppContext) : ExpoView(context, appContext) {

  private val onValueChange by EventDispatcher<Map<String, Any?>>()

  var theme: GlassTheme = GlassTheme.LIGHT
  /** Track when on; null: the theme's. */
  var accentColor: Int? = null
  /** Track when off; null: the theme's. */
  var trackColor: Int? = null

  private var selected = false
  private val density = resources.displayMetrics.density
  private val drag = DampedDrag(pressedScale = 1.5f, onFrame = ::invalidate)
  private val thumb = GlassThumb(density, fill = ::whiteThumbFill, shadow = true)
  private val sourceBackdrop = SourceBackdrop(this, inUse = { drag.pressProgress > 0.01f }, onChanged = ::invalidate)

  var backdropSource: String?
    get() = sourceBackdrop.name
    set(value) {
      sourceBackdrop.name = value
    }
  private val trackPaint = Paint(Paint.ANTI_ALIAS_FLAG)
  private val argb = ArgbEvaluator()

  private var startX = 0f
  private var startFraction = 0f
  private var didDrag = false

  init {
    setWillNotDraw(false)
    isClickable = true
  }

  fun setValue(value: Boolean) {
    if (value == selected) return
    selected = value
    if (drag.holding) return
    if (isLaidOut) drag.animateToValue(if (value) 1f else 0f) else drag.snapTo(if (value) 1f else 0f)
  }

  private val trackWidth get() = TRACK_W * density
  private val trackHeight get() = TRACK_H * density
  private val dragWidth get() = DRAG_DP * density

  private val claim = GestureClaim(this)

  override fun onTouchEvent(event: MotionEvent): Boolean {
    if (!isEnabled) return false
    claim.onEvent(event)
    when (event.actionMasked) {
      MotionEvent.ACTION_DOWN -> {
        startX = event.x
        startFraction = drag.targetValue
        didDrag = false
        drag.holding = true
        drag.press()
      }
      MotionEvent.ACTION_MOVE -> {
        if (event.x != startX) didDrag = true
        val direction = if (isRtl) -1f else 1f
        drag.updateValue(startFraction + direction * (event.x - startX) / dragWidth)
      }
      MotionEvent.ACTION_UP -> {
        drag.holding = false
        val next = if (didDrag) drag.targetValue >= 0.5f else !selected
        drag.updateValue(if (next) 1f else 0f)
        drag.release()
        if (next != selected) {
          selected = next
          onValueChange(mapOf("value" to next))
        }
        performClick()
      }
      MotionEvent.ACTION_CANCEL -> {
        drag.holding = false
        drag.updateValue(if (selected) 1f else 0f)
        drag.release()
      }
    }
    return true
  }

  private val trackLeft get() = (width - trackWidth) / 2f

  /** The track, centred in the view, fading from the track colour to the accent colour. */
  private fun drawTrack(canvas: Canvas) {
    val fraction = drag.value.value.coerceIn(0f, 1f)
    val left = trackLeft
    val top = (height - trackHeight) / 2f
    trackPaint.color = argb.evaluate(fraction, trackColor ?: theme.track, accentColor ?: theme.switchAccent) as Int
    canvas.drawRoundRect(left, top, left + trackWidth, top + trackHeight, trackHeight / 2f, trackHeight / 2f, trackPaint)
  }

  override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)
    drawTrack(canvas)

    // The thumb: 2dp in, 20dp of travel.
    val w = THUMB_W * density
    val h = THUMB_H * density
    // On to the right (left in RTL).
    val travel = PADDING_DP * density + dragWidth * drag.value.value
    val thumbLeft = if (isRtl) trackLeft + trackWidth - travel - w else trackLeft + travel
    val (sx, sy) = drag.stretchedScale(50f)
    thumb.draw(canvas, thumbLeft + w / 2f, height / 2f, w, h, drag.pressProgress, sx, sy, underThumb())
  }

  /** Capture path: what the pressed thumb's lens bends (the source behind, then the track). */
  private fun underThumb(): ((Canvas) -> Unit)? =
    if (BackdropApi.isSupported || Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
      null
    } else {
      { c ->
        sourceBackdrop.draw(c)
        drawTrack(c)
      }
    }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    sourceBackdrop.attach()
  }

  override fun onDetachedFromWindow() {
    drag.stop()
    sourceBackdrop.detach()
    super.onDetachedFromWindow()
  }

  private companion object {
    const val TRACK_W = 64f
    const val TRACK_H = 28f
    const val THUMB_W = 40f
    const val THUMB_H = 24f
    const val PADDING_DP = 2f
    const val DRAG_DP = 20f
  }
}
