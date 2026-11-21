package expo.modules.androidglassview

import android.graphics.Canvas
import android.graphics.Outline
import android.graphics.Paint
import android.graphics.RenderNode
import android.graphics.Shader
import android.os.Build
import android.util.Log
import kotlin.math.abs
import kotlin.math.roundToInt

/**
 * Kyant's DampedDragAnimation (Backdrop Catalog sample, Apache 2.0) without Compose: a value that
 * springs towards its target, the speed it moves at (for the stretch), and a press that swells
 * the thumb to [pressedScale] and is released once the value has (nearly) arrived.
 *
 * [onFrame] runs on every frame while anything moves; the owner redraws there.
 */
internal class DampedDrag(
  private val pressedScale: Float,
  private val onFrame: () -> Unit,
) {
  var range: Float = 1f

  val value = Spring(dampingRatio = 1f, stiffness = 1000f, threshold = 0.001f)
  private val velocitySpring = Spring(dampingRatio = 0.5f, stiffness = 300f, threshold = 0.01f)
  private val pressSpring = Spring(dampingRatio = 1f, stiffness = 1000f, threshold = 0.001f)
  private val scaleXSpring = Spring(dampingRatio = 0.6f, stiffness = 250f, threshold = 0.001f).apply { snapTo(1f) }
  private val scaleYSpring = Spring(dampingRatio = 0.7f, stiffness = 250f, threshold = 0.001f).apply { snapTo(1f) }

  private var releasePending = false
  private var trackVelocity = false
  private var previousValue = 0f
  /** Keeps the loop alive while a finger is down. */
  var holding = false

  private val loop = FrameLoop(::step)

  val pressProgress: Float get() = pressSpring.value
  val scaleX: Float get() = scaleXSpring.value
  val scaleY: Float get() = scaleYSpring.value
  /** Speed in ranges per second. */
  val velocity: Float get() = velocitySpring.value
  val targetValue: Float get() = value.target

  fun press() {
    pressSpring.target = 1f
    scaleXSpring.target = pressedScale
    scaleYSpring.target = pressedScale
    releasePending = false
    loop.start()
  }

  fun release() {
    releasePending = true
    loop.start()
  }

  fun updateValue(v: Float) {
    value.target = v.coerceIn(0f, range)
    trackVelocity = true
    loop.start()
  }

  fun moveToValue(v: Float) {
    value.target = v.coerceIn(0f, range)
    trackVelocity = false
    loop.start()
  }

  fun animateToValue(v: Float) {
    press()
    moveToValue(v)
    release()
  }

  fun snapTo(v: Float) {
    value.snapTo(v.coerceIn(0f, range))
    previousValue = value.value
  }

  fun stop() = loop.stop()

  private fun step(seconds: Float): Boolean {
    value.step(seconds)
    val r = range.coerceAtLeast(0.0001f)
    val raw = if (seconds > 0f) (value.value - previousValue) / seconds / r else 0f
    previousValue = value.value
    velocitySpring.target = if (trackVelocity) raw else 0f
    velocitySpring.step(seconds)
    if (releasePending && abs(value.value - value.target) < 0.025f * r) {
      releasePending = false
      pressSpring.target = 0f
      scaleXSpring.target = 1f
      scaleYSpring.target = 1f
    }
    pressSpring.step(seconds)
    scaleXSpring.step(seconds)
    scaleYSpring.step(seconds)
    onFrame()
    return holding || releasePending ||
      !(value.isAtRest && velocitySpring.isAtRest && pressSpring.isAtRest &&
        scaleXSpring.isAtRest && scaleYSpring.isAtRest)
  }
}

/**
 * A small glass element drawn by its owner (the toggle/slider thumb, the tab bar's droplet): a
 * capsule filled with [fill] (by press progress), turning into a liquid glass lens while pressed.
 *
 * - 37.2+: the capsule's own [RenderNode] carries `setBackdropRenderEffect`, so the platform
 *   supplies what the lens bends.
 * - Capture path: the owner passes [draw]'s `under`, which draws what lies beneath the capsule in
 *   the owner's coordinates (its source backdrop, track, …). It is recorded into a lens node with
 *   the capsule's transform undone, the liquid effect goes on that node, and the fill is drawn
 *   over it.
 */
internal class GlassThumb(
  density: Float,
  private val fill: (progress: Float) -> Int,
  private val shadow: Boolean,
) {
  private val node: RenderNode? =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) RenderNode("GlassThumb") else null
  private val lensNode: RenderNode? =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) RenderNode("GlassThumbLens") else null
  private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
  private val outline = Outline()
  private val lensOutline = Outline()
  private val elevation = 2f * density
  private var effectFailed = false

  /**
   * Draws the capsule centred on ([cx], [cy]), [w]×[h] px before its scale ([sx], [sy]).
   * @param under capture path only: draws what is beneath the capsule, owner-local.
   */
  fun draw(
    canvas: Canvas,
    cx: Float,
    cy: Float,
    w: Float,
    h: Float,
    progress: Float,
    sx: Float,
    sy: Float,
    under: ((Canvas) -> Unit)? = null,
  ) {
    val node = node ?: return
    if (!canvas.isHardwareAccelerated) return
    val iw = w.roundToInt().coerceAtLeast(1)
    val ih = h.roundToInt().coerceAtLeast(1)

    if (under != null && !BackdropApi.hasRenderNodeSetter) drawLens(canvas, cx, cy, w, h, iw, ih, progress, sx, sy, under)

    place(node, cx, cy, w, h, iw, ih, sx, sy)
    if (shadow) {
      outline.setRoundRect(0, 0, iw, ih, h / 2f)
      node.setOutline(outline)
      node.setElevation(elevation)
      node.setAmbientShadowColor(0x0D000000) // black 5%, like the upstream thumb shadow
      node.setSpotShadowColor(0x0D000000)
    }
    val recording = node.beginRecording()
    try {
      paint.color = fill(progress)
      recording.drawRoundRect(0f, 0f, w, h, h / 2f, h / 2f, paint)
    } finally {
      node.endRecording()
    }
    if (BackdropApi.hasRenderNodeSetter) applyPlatformBackdrop(node, w, h, progress)
    canvas.drawRenderNode(node)
  }

  private fun place(node: RenderNode, cx: Float, cy: Float, w: Float, h: Float, iw: Int, ih: Int, sx: Float, sy: Float) {
    node.setPosition(0, 0, iw, ih)
    node.setPivotX(w / 2f)
    node.setPivotY(h / 2f)
    node.setTranslationX(cx - w / 2f)
    node.setTranslationY(cy - h / 2f)
    node.setScaleX(sx)
    node.setScaleY(sy)
  }

  private fun drawLens(
    canvas: Canvas, cx: Float, cy: Float, w: Float, h: Float, iw: Int, ih: Int,
    progress: Float, sx: Float, sy: Float, under: (Canvas) -> Unit,
  ) {
    val lens = lensNode ?: return
    if (progress <= 0.01f || effectFailed) return
    val effect = liquid(w, h, progress) ?: return
    place(lens, cx, cy, w, h, iw, ih, sx, sy)
    // Clip to the capsule: outside its shape the shader passes through what it was given, which
    // here is the owner's processed surface, not the screen. Once the pressed capsule swells past
    // the owner (the tab bar), that showed as a frosted rectangle around it.
    lensOutline.setRoundRect(0, 0, iw, ih, h / 2f)
    lens.setOutline(lensOutline)
    lens.setClipToOutline(true)
    val recording = lens.beginRecording()
    try {
      // Undo the capsule's transform: local q shows the owner's point (cx, cy) + S·(q − pivot).
      recording.translate(w / 2f, h / 2f)
      recording.scale(1f / sx, 1f / sy)
      recording.translate(-cx, -cy)
      under(recording)
    } finally {
      lens.endRecording()
    }
    lens.setRenderEffect(effect)
    canvas.drawRenderNode(lens)
  }

  private fun liquid(w: Float, h: Float, progress: Float) = try {
    BackdropEffects.build(
      EffectParams(
        name = "liquid",
        radius = 0f,
        tileMode = Shader.TileMode.CLAMP,
        offsetX = 0f,
        offsetY = 0f,
        cornerRadius = h / 2f,
        height = 0f,
        amount = 0f,
        width = w,
        heightPx = h,
        uniforms = mapOf("opacity" to progress.coerceIn(0f, 1f)),
      )
    )
  } catch (t: Throwable) {
    // e.g. no RuntimeShader below API 33: the capsule stays a plain fill.
    effectFailed = true
    Log.w("GlassThumb", "lens failed", t)
    null
  }

  private fun applyPlatformBackdrop(node: RenderNode, w: Float, h: Float, progress: Float) {
    if (effectFailed) return
    try {
      BackdropApi.set(node, if (progress > 0.01f) liquid(w, h, progress) else null)
    } catch (t: Throwable) {
      effectFailed = true
      Log.w("GlassThumb", "thumb backdrop failed", t)
    }
  }
}

/** The thumb's scale with the stretch of its speed (DampedDragAnimation's layerBlock). */
internal fun DampedDrag.stretchedScale(velocityDivisor: Float): Pair<Float, Float> {
  val v = velocity / velocityDivisor
  return (scaleX / (1f - (v * 0.75f).coerceIn(-0.2f, 0.2f))) to
    (scaleY * (1f - (v * 0.25f).coerceIn(-0.2f, 0.2f)))
}

/** The toggle/slider thumb's fill: white, fading out while pressed. */
internal fun whiteThumbFill(progress: Float): Int =
  ((255 * (1f - progress).coerceIn(0f, 1f)).roundToInt() shl 24) or 0xFFFFFF
