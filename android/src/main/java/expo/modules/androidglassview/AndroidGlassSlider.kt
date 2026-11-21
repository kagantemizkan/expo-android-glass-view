package expo.modules.androidglassview

import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.os.Build
import android.view.MotionEvent
import kotlin.math.abs
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

/**
 * A glass slider, after Kyant's LiquidSlider (Backdrop Catalog sample, Apache 2.0): a 6dp track
 * filled with the accent colour up to the value, and a 40×24dp thumb that is white at rest and
 * turns into a liquid glass lens (swelling ×1.5) while pressed.
 *
 * The whole slider takes touches: pressing anywhere moves the thumb under the finger, dragging
 * follows it, and lifting ends the slide. Left-to-right only for now.
 *
 * Below 37.2, the pressed thumb's lens bends the named `backdropSource` (and the track); without a
 * source it bends only the track.
 */
class AndroidGlassSlider(context: Context, appContext: AppContext) : ExpoView(context, appContext) {

  private val onValueChange by EventDispatcher<Map<String, Any?>>()
  private val onSlidingComplete by EventDispatcher<Map<String, Any?>>()

  var theme: GlassTheme = GlassTheme.LIGHT
  /** The filled part; null: the theme's. */
  var accentColor: Int? = null
  /** Null: the theme's. */
  var trackColor: Int? = null
  var minimumValue: Float = 0f
  var maximumValue: Float = 1f

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
  private val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG)
  private var lastEmitted = Float.NaN

  init {
    setWillNotDraw(false)
    isClickable = true
  }

  /** The value from JS, applied in [commit] once every prop of the update is in. */
  var value: Float = 0f

  /**
   * Values sent to JS during the current slide that JS has not answered yet. A controlled slider
   * (`value={v} onValueChange={setV}`) sends each one back as a prop, and JS lags behind the
   * finger: after a quick slide those echoes kept arriving once the finger had lifted and pulled
   * the thumb back towards where the finger had been, then forward again. They are dropped here;
   * the last value sent, or any value this slider did not send, still moves the thumb.
   */
  private val echoes = ArrayDeque<Float>()

  private fun isStaleEcho(value: Float): Boolean {
    val i = echoes.indexOfFirst { abs(it - value) <= ECHO_TOLERANCE }
    if (i < 0) {
      echoes.clear() // a value from elsewhere: JS has moved on
      return false
    }
    val last = echoes.last()
    // Everything sent before this one has been answered (props arrive in order).
    repeat(i + 1) { echoes.removeFirst() }
    return abs(value - last) > ECHO_TOLERANCE
  }

  /** Moves the thumb to [value]; ignored while the user is sliding. */
  fun commit() {
    invalidate() // colours or theme may have changed
    if (isStaleEcho(value)) return
    val fraction = fractionOf(value)
    if (drag.holding || fraction == drag.targetValue) return
    if (isLaidOut) drag.updateValue(fraction) else drag.snapTo(fraction)
  }

  /** Sends [fraction] to JS and remembers it, so its echo can be recognised. */
  private fun emit(fraction: Float) {
    lastEmitted = fraction
    val value = valueOf(fraction)
    echoes.addLast(value)
    if (echoes.size > MAX_ECHOES) echoes.removeFirst()
    onValueChange(mapOf("value" to value))
  }

  private fun fractionOf(value: Float): Float {
    val span = maximumValue - minimumValue
    return if (span != 0f) ((value - minimumValue) / span).coerceIn(0f, 1f) else 0f
  }

  private fun valueOf(fraction: Float) = minimumValue + (maximumValue - minimumValue) * fraction

  /** Fills from the left (from the right in RTL). */
  private fun fractionAt(x: Float): Float {
    if (width <= 0) return 0f
    val f = (x / width).coerceIn(0f, 1f)
    return if (isRtl) 1f - f else f
  }

  private val claim = GestureClaim(this)
  private var startFraction = 0f

  private fun slideTo(x: Float) {
    val fraction = fractionAt(x)
    drag.updateValue(fraction)
    if (fraction != lastEmitted) emit(fraction)
  }

  override fun onTouchEvent(event: MotionEvent): Boolean {
    if (!isEnabled) return false
    claim.onEvent(event)
    when (event.actionMasked) {
      MotionEvent.ACTION_DOWN -> {
        startFraction = drag.targetValue
        drag.holding = true
        drag.press()
        slideTo(event.x)
      }
      MotionEvent.ACTION_MOVE -> slideTo(event.x)
      MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
        if (event.actionMasked == MotionEvent.ACTION_UP) {
          slideTo(event.x) // the lift point wins
        } else {
          // Taken over (e.g. a vertical scroll): put the value back where the touch found it.
          drag.updateValue(startFraction)
          if (startFraction != lastEmitted) emit(startFraction)
        }
        drag.holding = false
        drag.release()
        onSlidingComplete(mapOf("value" to valueOf(drag.targetValue)))
        if (event.actionMasked == MotionEvent.ACTION_UP) performClick()
      }
    }
    return true
  }

  /** The 6dp track and its accent fill up to the value. */
  private fun drawTrack(canvas: Canvas) {
    val w = width.toFloat()
    val cy = height / 2f
    val trackH = TRACK_H * density
    val progress = drag.value.value.coerceIn(0f, 1f)
    trackPaint.color = trackColor ?: theme.track
    canvas.drawRoundRect(0f, cy - trackH / 2f, w, cy + trackH / 2f, trackH / 2f, trackH / 2f, trackPaint)
    fillPaint.color = accentColor ?: theme.accent
    val fillLeft = if (isRtl) w * (1f - progress) else 0f
    val fillRight = if (isRtl) w else w * progress
    canvas.drawRoundRect(fillLeft, cy - trackH / 2f, fillRight, cy + trackH / 2f, trackH / 2f, trackH / 2f, fillPaint)
  }

  override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)
    drawTrack(canvas)

    // LiquidSlider: the thumb's left edge follows the value, kept a quarter-thumb inside the ends.
    val w = width.toFloat()
    val progress = drag.value.value.coerceIn(0f, 1f)
    val tw = THUMB_W * density
    val th = THUMB_H * density
    val thumbLeft = (-tw / 2f + w * progress).coerceIn(-tw / 4f, w - tw * 3f / 4f)
    val cx = if (isRtl) w - (thumbLeft + tw / 2f) else thumbLeft + tw / 2f
    val (sx, sy) = drag.stretchedScale(10f)
    thumb.draw(canvas, cx, height / 2f, tw, th, drag.pressProgress, sx, sy, underThumb())
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
    const val TRACK_H = 6f
    const val THUMB_W = 40f
    const val THUMB_H = 24f
    const val MAX_ECHOES = 256
    const val ECHO_TOLERANCE = 1e-4f
  }
}
