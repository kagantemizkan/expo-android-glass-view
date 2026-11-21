package expo.modules.androidglassview

import android.view.Choreographer
import kotlin.math.abs
import kotlin.math.min
import kotlin.math.sqrt

/**
 * A damped spring like Compose's `spring(dampingRatio, stiffness)` (mass 1), stepped by hand so
 * the view needs no animation library.
 */
internal class Spring(
  private val dampingRatio: Float,
  private val stiffness: Float,
  private val threshold: Float,
) {
  var value = 0f
    private set
  var target = 0f
  private var velocity = 0f

  val isAtRest: Boolean get() = abs(value - target) < threshold && abs(velocity) < threshold * 10f

  fun snapTo(v: Float) {
    value = v
    target = v
    velocity = 0f
  }

  fun step(seconds: Float) {
    val damping = 2f * dampingRatio * sqrt(stiffness)
    var left = seconds
    while (left > 0f) {
      val h = min(left, 0.004f) // small sub-steps keep the semi-implicit Euler stable
      velocity += (-stiffness * (value - target) - damping * velocity) * h
      value += velocity * h
      left -= h
    }
    if (isAtRest) snapTo(target)
  }
}

/**
 * The press state of Kyant's LiquidButton / InteractiveHighlight (Backdrop Catalog sample),
 * without Compose: how far the glass is pressed (0..1, springy) and where the finger is, in the
 * view's own coordinates. On release both spring back. [onFrame] runs on every animation frame
 * while anything is moving.
 */
internal class PressInteraction(private val onFrame: () -> Unit) : Choreographer.FrameCallback {

  // InteractiveHighlight: spring(0.5f, 300f) for both the press and the position.
  private val progressSpring = Spring(dampingRatio = 0.5f, stiffness = 300f, threshold = 0.001f)
  private val xSpring = Spring(dampingRatio = 0.5f, stiffness = 300f, threshold = 0.5f)
  private val ySpring = Spring(dampingRatio = 0.5f, stiffness = 300f, threshold = 0.5f)

  private var startX = 0f
  private var startY = 0f
  private var lastFrameNanos = 0L
  private var running = false

  /** 0 at rest, 1 fully pressed (overshoots a little, it is a spring). */
  val progress: Float get() = progressSpring.value

  /** Where the finger is (springs back to where it went down). */
  val touchX: Float get() = xSpring.value
  val touchY: Float get() = ySpring.value

  /** Finger position minus where it went down. */
  val offsetX: Float get() = xSpring.value - startX
  val offsetY: Float get() = ySpring.value - startY

  fun down(x: Float, y: Float) {
    startX = x
    startY = y
    xSpring.snapTo(x)
    ySpring.snapTo(y)
    progressSpring.target = 1f
    start()
  }

  fun move(x: Float, y: Float) {
    xSpring.snapTo(x)
    ySpring.snapTo(y)
    onFrame()
  }

  fun release() {
    progressSpring.target = 0f
    xSpring.target = startX
    ySpring.target = startY
    start()
  }

  private fun start() {
    if (running) return
    running = true
    lastFrameNanos = 0L
    Choreographer.getInstance().postFrameCallback(this)
  }

  override fun doFrame(frameTimeNanos: Long) {
    val seconds = if (lastFrameNanos == 0L) 1f / 60f else (frameTimeNanos - lastFrameNanos) / 1e9f
    lastFrameNanos = frameTimeNanos
    val dt = seconds.coerceIn(0f, 0.05f)
    progressSpring.step(dt)
    xSpring.step(dt)
    ySpring.step(dt)
    onFrame()
    if (progressSpring.isAtRest && xSpring.isAtRest && ySpring.isAtRest) {
      running = false
    } else {
      Choreographer.getInstance().postFrameCallback(this)
    }
  }

  fun stop() {
    Choreographer.getInstance().removeFrameCallback(this)
    running = false
  }
}

/** Calls [step] with the frame time in seconds on every frame until it returns false. */
internal class FrameLoop(private val step: (seconds: Float) -> Boolean) : Choreographer.FrameCallback {
  private var lastFrameNanos = 0L
  private var running = false

  fun start() {
    if (running) return
    running = true
    lastFrameNanos = 0L
    Choreographer.getInstance().postFrameCallback(this)
  }

  fun stop() {
    Choreographer.getInstance().removeFrameCallback(this)
    running = false
  }

  override fun doFrame(frameTimeNanos: Long) {
    val seconds = if (lastFrameNanos == 0L) 1f / 60f else (frameTimeNanos - lastFrameNanos) / 1e9f
    lastFrameNanos = frameTimeNanos
    if (step(seconds.coerceIn(0f, 0.05f))) {
      Choreographer.getInstance().postFrameCallback(this)
    } else {
      running = false
    }
  }
}
