package expo.modules.androidglassview

import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PorterDuff
import android.graphics.PorterDuffColorFilter
import android.graphics.RectF
import android.os.Build
import android.util.Log
import android.view.MotionEvent
import android.view.ViewConfiguration
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import kotlin.math.abs
import kotlin.math.roundToInt

/**
 * A glass tab bar, after Kyant's LiquidBottomTabs (Backdrop Catalog sample, Apache 2.0), on the
 * platform backdrop instead of Compose:
 *
 * - the bar is this glass view; React Native lays the tabs out in a row (equal widths, [PADDING_DP]
 *   around them);
 * - the droplet (selection indicator) is a [RenderNode] drawn over the tabs, with its own
 *   `RenderNode.setBackdropRenderEffect`: a dark capsule at rest, a liquid glass lens while pressed,
 *   swelling to 78/56 and stretching with its speed;
 * - under the droplet the tabs are drawn again in the accent colour (and magnified ×1.2 while
 *   pressed), so the lens refracts an accent copy of the selected tab.
 *
 * Gestures: a tap selects the tab under the finger; touching the droplet presses it and drags it;
 * a horizontal drag anywhere scrubs the droplet under the finger, and releasing selects the nearest
 * tab; a vertical drag selects nothing; a cancelled gesture returns to the selected tab.
 * Left-to-right only for now.
 */
class AndroidGlassTabs(context: Context, appContext: AppContext) : AndroidGlassView(context, appContext) {

  private val onTabSelected by EventDispatcher<Map<String, Any?>>()

  var tabsCount: Int = 0
    set(value) {
      field = value.coerceAtLeast(0)
      snapToSelection()
    }
  /** Null: the theme's. */
  var accentColor: Int? = null

  /** The selected tab. Set from JS (`selectedIndex`) or by the user. */
  private var currentIndex = 0

  private val density = resources.displayMetrics.density
  private val padding = PADDING_DP * density
  private val touchSlop = ViewConfiguration.get(context).scaledTouchSlop

  // DampedDragAnimation's springs.
  private val value = Spring(dampingRatio = 1f, stiffness = 1000f, threshold = 0.001f)
  private val velocity = Spring(dampingRatio = 0.5f, stiffness = 300f, threshold = 0.01f)
  private val pressProgress = Spring(dampingRatio = 1f, stiffness = 1000f, threshold = 0.001f)
  private val scaleXSpring = Spring(dampingRatio = 0.6f, stiffness = 250f, threshold = 0.001f).apply { snapTo(1f) }
  private val scaleYSpring = Spring(dampingRatio = 0.7f, stiffness = 250f, threshold = 0.001f).apply { snapTo(1f) }

  /** Release the droplet once it is close to its target (DampedDragAnimation.release). */
  private var releasePending = false
  /** Feed the droplet's speed into the stretch (false for jumps, like moveToValue). */
  private var trackVelocity = false
  private var previousValue = 0f

  private val loop = FrameLoop(::onFrame)

  // LiquidBottomTabs' droplet surface: black (dark theme: white) 10% at rest, 3% while pressed.
  private val droplet = GlassThumb(
    density = resources.displayMetrics.density,
    fill = { p ->
      val alpha = (255 * (0.10f * (1f - p) + 0.03f * p)).roundToInt().coerceIn(0, 255)
      (alpha shl 24) or (theme.droplet and 0xFFFFFF)
    },
    shadow = false,
  )
  private val tintPaint = Paint()
  private val dropletRect = RectF()
  private val clipPath = Path()

  init {
    clip = false // the pressed droplet swells past the bar
    isClickable = true
  }

  fun setSelectedIndex(index: Int) {
    val target = index.coerceIn(0, (tabsCount - 1).coerceAtLeast(0))
    if (target == currentIndex) return
    currentIndex = target
    if (width == 0 || gesture != Gesture.None) {
      if (gesture == Gesture.None) snapToSelection()
      return
    }
    animateToValue(target.toFloat())
  }

  // --- Geometry (px, in this view) ---

  private val tabWidth: Float
    get() = if (tabsCount > 0) ((width - padding * 2f) / tabsCount).coerceAtLeast(0f) else 0f

  private val lastIndex: Float get() = (tabsCount - 1).coerceAtLeast(0).toFloat()

  /** Tab [v]'s centre; tabs run right to left in RTL (React Native mirrors the row too). */
  private fun dropletCenterX(v: Float = value.value) =
    if (isRtl) width - padding - (v + 0.5f) * tabWidth else padding + (v + 0.5f) * tabWidth

  /** The droplet slot under the finger, as a fractional index. */
  private fun valueAt(x: Float): Float {
    if (tabWidth <= 0f) return 0f
    val slot = ((x - padding) / tabWidth - 0.5f).coerceIn(0f, lastIndex)
    return if (isRtl) lastIndex - slot else slot
  }

  // --- Animation (DampedDragAnimation) ---

  private fun press() {
    pressProgress.target = 1f
    scaleXSpring.target = PRESSED_SCALE
    scaleYSpring.target = PRESSED_SCALE
    releasePending = false
    loop.start()
  }

  private fun release() {
    releasePending = true
    loop.start()
  }

  /** Moves the droplet with its speed feeding the stretch. */
  private fun updateValue(v: Float) {
    value.target = v.coerceIn(0f, lastIndex)
    trackVelocity = true
    loop.start()
  }

  /** Moves the droplet without stretching it. */
  private fun moveToValue(v: Float) {
    value.target = v.coerceIn(0f, lastIndex)
    trackVelocity = false
    loop.start()
  }

  /** Press, move to [v], release on arrival: how a tap moves the droplet. */
  private fun animateToValue(v: Float) {
    press()
    moveToValue(v)
    release()
  }

  private fun snapToSelection() {
    currentIndex = currentIndex.coerceIn(0, (tabsCount - 1).coerceAtLeast(0))
    value.snapTo(currentIndex.toFloat())
    previousValue = value.value
    invalidate()
  }

  private fun onFrame(seconds: Float): Boolean {
    value.step(seconds)
    val range = lastIndex.coerceAtLeast(1f)
    val raw = if (seconds > 0f) (value.value - previousValue) / seconds / range else 0f
    previousValue = value.value
    velocity.target = if (trackVelocity) raw else 0f
    velocity.step(seconds)

    if (releasePending && abs(value.value - value.target) < 0.025f * range) {
      releasePending = false
      pressProgress.target = 0f
      scaleXSpring.target = 1f
      scaleYSpring.target = 1f
    }
    pressProgress.step(seconds)
    scaleXSpring.step(seconds)
    scaleYSpring.step(seconds)

    // LiquidBottomTabs: the bar swells by 16dp in width while the droplet is pressed.
    val barScale = if (width > 0) 1f + 16f * density / width * pressProgress.value else 1f
    scaleX = barScale
    scaleY = barScale
    try {
      applyBackdrop() // the bar's highlight follows the droplet
    } catch (t: Throwable) {
      Log.w(TAG, "bar frame failed", t)
    }
    invalidate()

    return releasePending || gesture != Gesture.None ||
      !(value.isAtRest && velocity.isAtRest && pressProgress.isAtRest &&
        scaleXSpring.isAtRest && scaleYSpring.isAtRest)
  }

  override val highlightProgress: Float get() = pressProgress.value
  override val highlightX: Float get() = dropletCenterX()
  override val highlightY: Float get() = height / 2f

  // --- Gestures ---

  private enum class Gesture { None, Undecided, Droplet, Scrub, Vertical }

  private var gesture = Gesture.None
  private var startX = 0f
  private var startY = 0f
  private var startValue = 0f

  private val claim = GestureClaim(this)

  override fun onTouchEvent(event: MotionEvent): Boolean {
    if (!isEnabled || tabsCount == 0) return false
    claim.onEvent(event)
    when (event.actionMasked) {
      MotionEvent.ACTION_DOWN -> {
        startX = event.x
        startY = event.y
        startValue = value.value
        val half = tabWidth / 2f
        val onDroplet = abs(event.x - dropletCenterX()) <= half && event.y in padding..(height - padding)
        gesture = if (onDroplet) Gesture.Droplet else Gesture.Undecided
        if (onDroplet) press()
      }
      MotionEvent.ACTION_MOVE -> {
        val dx = abs(event.x - startX)
        val dy = abs(event.y - startY)
        when (gesture) {
          Gesture.Droplet -> {
            val direction = if (isRtl) -1f else 1f
            updateValue(startValue + direction * (event.x - startX) / tabWidth.coerceAtLeast(1f))
          }
          Gesture.Scrub -> updateValue(valueAt(event.x))
          Gesture.Undecided -> when {
            dy > touchSlop && dy >= dx -> gesture = Gesture.Vertical
            dx > touchSlop && dx > dy -> {
              gesture = Gesture.Scrub
              press()
              moveToValue(valueAt(event.x)) // jump under the finger without stretching
            }
          }
          else -> Unit
        }
      }
      MotionEvent.ACTION_UP -> {
        when (gesture) {
          Gesture.Droplet, Gesture.Scrub -> select(value.target.roundToInt())
          Gesture.Undecided -> select(valueAt(event.x).roundToInt())
          else -> Unit
        }
        gesture = Gesture.None
        if (pressProgress.target > 0f && !releasePending) release()
      }
      MotionEvent.ACTION_CANCEL -> {
        val wasMoving = gesture == Gesture.Droplet || gesture == Gesture.Scrub
        gesture = Gesture.None
        if (wasMoving) moveToValue(currentIndex.toFloat())
        release()
      }
    }
    return true
  }

  private fun select(index: Int) {
    val target = index.coerceIn(0, (tabsCount - 1).coerceAtLeast(0))
    if (target != currentIndex) {
      currentIndex = target
      onTabSelected(mapOf("index" to target))
    }
    animateToValue(target.toFloat())
  }

  // --- Drawing ---

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    snapToSelection()
  }

  override fun dispatchDraw(canvas: Canvas) {
    if (tabsCount == 0 || width == 0 || height == 0) {
      super.dispatchDraw(canvas)
      return
    }

    val progress = pressProgress.value
    val stretch = velocity.value / 10f
    val sx = scaleXSpring.value / (1f - (stretch * 0.75f).coerceIn(-0.2f, 0.2f))
    val sy = scaleYSpring.value * (1f - (stretch * 0.25f).coerceIn(-0.2f, 0.2f))
    val w = tabWidth
    val h = height - padding * 2f
    val cx = dropletCenterX()
    val cy = height / 2f
    dropletRect.set(cx - w * sx / 2f, cy - h * sy / 2f, cx + w * sx / 2f, cy + h * sy / 2f)
    val r = dropletRect.height() / 2f

    clipPath.reset()
    clipPath.addRoundRect(dropletRect, r, r, Path.Direction.CW)

    // The tabs (and the lab outline), except under the droplet: like LiquidBottomTabs, the
    // droplet only shows the accent copy, never the plain tab underneath.
    val plain = canvas.save()
    canvas.clipOutPath(clipPath)
    super.dispatchDraw(canvas)
    canvas.restoreToCount(plain)

    // The tabs again in the accent colour, only inside the droplet, magnified while pressed.
    drawAccentCopy(canvas, cx, cy, progress)

    // The droplet: dark capsule at rest, glass lens while pressed. On the capture path its lens
    // bends this bar's processed backdrop and the accent copy (what lies under it here).
    val under: ((Canvas) -> Unit)? =
      if (!BackdropApi.hasRenderNodeSetter && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        { c ->
          drawProcessedBackdrop(c)
          drawAccentCopy(c, cx, cy, progress)
        }
      } else {
        null
      }
    droplet.draw(canvas, cx, cy, w, h, progress, sx, sy, under)
  }

  private fun drawAccentCopy(canvas: Canvas, cx: Float, cy: Float, progress: Float) {
    tintPaint.colorFilter = PorterDuffColorFilter(accentColor ?: theme.accent, PorterDuff.Mode.SRC_IN)
    val save = canvas.save()
    canvas.clipPath(clipPath)
    val magnify = 1f + 0.2f * progress
    canvas.scale(magnify, magnify, cx, cy)
    canvas.saveLayer(null, tintPaint)
    val time = drawingTime
    for (i in 0 until childCount) {
      val child = getChildAt(i)
      if (child.visibility == VISIBLE) drawChild(canvas, child, time)
    }
    canvas.restoreToCount(save)
  }

  override fun onDetachedFromWindow() {
    loop.stop()
    super.onDetachedFromWindow()
  }

  private companion object {
    const val TAG = "GlassTabs"
    const val PADDING_DP = 4f
    const val PRESSED_SCALE = 78f / 56f
  }
}
