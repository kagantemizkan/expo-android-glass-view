package expo.modules.androidglassview

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Outline
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RenderEffect
import android.graphics.RenderNode
import android.graphics.Shader
import android.os.Build
import android.util.Log
import android.view.MotionEvent
import android.view.View
import android.view.ViewOutlineProvider
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import kotlin.math.abs
import kotlin.math.atan2
import kotlin.math.ceil
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin
import kotlin.math.roundToInt
import kotlin.math.tanh

/**
 * The glass surface. React Native lays out and draws its children; this view puts an effect
 * (blur, liquid glass, …) on what is behind it, in one of three ways ([BackdropMode]):
 *
 * - `platform` (37.2+): `setBackdropRenderEffect`; the platform supplies the backdrop.
 * - `capture` (API 31–37.1): the named [GlassBackdropSource] (`backdropSource`) supplies it. The
 *   glass draws the source's capture node, moved so the source lines up with the screen and
 *   undoing the glass's own transform (so a pressed, swelling glass doesn't drag its backdrop
 *   along), into a node of its own that carries the effect. The node is larger than the glass by a
 *   sampling margin when the effect blurs, so the blur reads real pixels at the edges.
 * - `flat`: no backdrop (no source, the glass is inside its source, or below API 31); only the
 *   tint shows.
 *
 * Every applied configuration is reported through `onBackdropStatus`, so a test case can show
 * on screen whether the platform accepted it or threw.
 *
 * With `interactive`, it is a pressable glass (Kyant's LiquidButton): pressed, it swells by 4dp,
 * leans and stretches towards the finger, and the glass shader lights up under the finger; it
 * springs back on release and fires `onPress` when the finger lifts inside it.
 */
open class AndroidGlassView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {

  private val onBackdropStatus by EventDispatcher<Map<String, Any?>>()
  private val onPress by EventDispatcher<Map<String, Any?>>()

  // Public props, in dp where they are lengths.
  var cornerRadius: Float = 0f
  /** Blur under the glass; null: the style's. */
  var blurRadius: Float? = null
  /** iOS-like presets for blur, surface tint, lens and highlights. */
  var glassEffectStyle: GlassEffectStyle = GlassEffectStyle.REGULAR
  /** Liquid glass lens; false: plain blur/tint. */
  var refraction: Boolean = true
  var tintColor: Int? = null
  /** Shown instead of the glass where there is no backdrop (flat mode). Null: the theme's. */
  var fallbackColor: Int? = null
  var theme: GlassTheme = GlassTheme.LIGHT

  // Lab props (the example's backdrop lab; not part of the public JS API).
  /** Overrides the effect derived from the public props (e.g. "agsl-invert"). */
  var labEffect: String? = null
  var tileMode: String = "clamp"
  var offsetX: Float = 0f
  var offsetY: Float = 0f
  var clip: Boolean = true
  var refractionHeight: Float = 24f
  var amount: Float = 24f
  var selfEffect: String = "none"
  var strokeColor: Int? = null
  var margin: Float = 0f
  var uniforms: Map<String, Float> = emptyMap()
  var interactive: Boolean = false
  var backdropSource: String?
    get() = sourceBackdrop.name
    set(value) {
      sourceBackdrop.name = value
    }

  private val density = resources.displayMetrics.density

  /** The glass's height in dp (0 before layout): iOS frosts taller glass more. */
  private val heightDp: Float
    get() = height / density

  /** The blur in effect: the prop, else the style's (lab effects: none unless given). */
  private val effectiveBlur: Float
    get() = blurRadius ?: if (labEffect == null) glassEffectStyle.blurFor(heightDp) else 0f

  /** The effect the props ask for: the lab's override, or liquid glass / blur / none. */
  val effect: String
    get() = labEffect ?: when {
      refraction && effectiveBlur > 0f -> "liquid-blur"
      refraction -> "liquid"
      effectiveBlur > 0f -> "blur"
      else -> "none"
    }

  /**
   * The style's shader values and surface tint (tintColor, else the style's for the theme). The
   * lens band is a fixed width in dp ([GlassEffectStyle.lensBand]); the shader takes it as a
   * fraction of the glass's height, so it is converted for this view's size here. As a fraction it
   * grew with the glass, and a tall card bent and mirrored half its height (iOS keeps a band of
   * about the same width at every size).
   */
  private fun styleUniforms(): Map<String, Float> {
    val tint = tintColor ?: glassEffectStyle.tint(theme, heightDp)
    val band = if (height > 0) {
      mapOf("lensRefraction" to (glassEffectStyle.lensBand * density / height).coerceIn(0.02f, 0.5f))
    } else {
      emptyMap()
    }
    return glassEffectStyle.uniforms(theme, heightDp) + band + mapOf(
      "tintR" to Color.red(tint) / 255f,
      "tintG" to Color.green(tint) / 255f,
      "tintB" to Color.blue(tint) / 255f,
      "tintA" to Color.alpha(tint) / 255f,
    )
  }

  private val press = PressInteraction(onFrame = ::onPressFrame)

  /** The named source this glass shows on the capture path. */
  internal val sourceBackdrop = SourceBackdrop(this, onChanged = { onSourceChanged() })

  // --- Capture path state ---
  private val captureBackdropNode: RenderNode? =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) RenderNode("AndroidGlassBackdrop") else null
  private var captureEffect: RenderEffect? = null
  /** Downsampled blur (glass and blur effects): the backdrop is blurred at 1/[blurScale] size. */
  private val captureBlurNode: RenderNode? =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) RenderNode("AndroidGlassBlur") else null
  private var captureBlur: RenderEffect? = null
  private var blurScale = 1
  /** The capture effects are built (captureEffect may stay null: a plain blur has no shader). */
  private var captureReady = false
  private val clipPath = Path()

  init {
    outlineProvider = object : ViewOutlineProvider() {
      override fun getOutline(view: View, outline: Outline) {
        val m = (margin * density).toInt()
        outline.setRoundRect(m, m, view.width - m, view.height - m, cornerRadius * density)
      }
    }
  }

  /** Applies all props at once; called after every prop update and on resize. */
  fun commit() {
    // Flat (no backdrop here): the fallback colour stands in for the glass.
    // The tint is part of the glass shader; as a background it only stands in where there is no
    // shader (effect "none") and in the lab's effects.
    setBackgroundColor(
      when {
        mode == BackdropMode.FLAT && effect != "none" -> fallbackColor ?: theme.fallback
        labEffect != null || effect == "none" -> tintColor ?: 0
        else -> 0
      }
    )
    // iOS draws a soft shadow under regular glass.
    elevation = if (labEffect == null && glassEffectStyle == GlassEffectStyle.REGULAR) 6f * density else 0f
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      outlineAmbientShadowColor = 0x33000000
      outlineSpotShadowColor = 0x33000000
    }
    setWillNotDraw(false)
    invalidate()
    clipToOutline = clip && (cornerRadius > 0f || margin > 0f)
    invalidateOutline()

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      setRenderEffect(
        if (selfEffect == "blur") {
          RenderEffect.createBlurEffect(effectiveBlur * density, effectiveBlur * density, Shader.TileMode.CLAMP)
        } else {
          null
        }
      )
    }

    isClickable = interactive
    if (!interactive) resetPress()

    if (width == 0 || height == 0) return // shaders need the size; onSizeChanged commits again

    var applied = false
    var error: String? = null
    try {
      applyBackdrop()
      applied = true
    } catch (t: Throwable) {
      error = "${t.javaClass.simpleName}: ${t.message}"
      Log.w(TAG, "effect=$effect failed", t)
    }
    reportedMode = mode
    Log.i(TAG, "effect=$effect mode=${mode.name} applied=$applied sdk=${BackdropApi.sdkFull} error=$error")
    onBackdropStatus(
      mapOf(
        "effect" to effect,
        "applied" to applied,
        "error" to error,
        "supported" to BackdropApi.isSupported,
        "mode" to mode.name.lowercase(),
        "sdkFull" to BackdropApi.sdkFull,
        "width" to width,
        "height" to height,
      )
    )
  }

  /** How this glass gets its backdrop right now. */
  internal val mode: BackdropMode
    get() = when {
      BackdropApi.isSupported -> BackdropMode.PLATFORM
      Build.VERSION.SDK_INT < Build.VERSION_CODES.S -> BackdropMode.FLAT
      sourceBackdrop.source == null -> BackdropMode.FLAT
      else -> BackdropMode.CAPTURE
    }

  protected fun applyBackdrop() {
    when (mode) {
      BackdropMode.PLATFORM -> BackdropApi.set(this, BackdropEffects.build(params()))
      BackdropMode.CAPTURE -> {
        buildCaptureEffects()
        captureReady = true
        invalidate()
      }
      BackdropMode.FLAT -> {
        captureEffect = null
        captureBlur = null
        captureReady = false
      }
    }
  }

  /**
   * The glass looks ("liquid-blur", "blur") blur a copy of the backdrop scaled down by
   * [blurScale] and scale it back up before the shader: a blurred image loses nothing at lower
   * resolution, and a full-size blur was most of the GPU time of every frame the glass redraws
   * (a fling dropped about every third frame). Lab effects keep the full-size chain.
   */
  private fun buildCaptureEffects() {
    val chain = effect == "liquid-blur" || effect == "blur"
    val radius = effectiveBlur * density
    // HWUI turns a blur radius r into sigma 0.57735 r + 0.5.
    val sigma = BLUR_SIGMA_SCALE * radius + 0.5f
    // A light blur (the clear style) keeps detail the lens magnifies at the rim: blurring it at a
    // lower resolution softens that visibly, so only frosted glass is downsampled.
    if (!chain || sigma < MIN_DOWNSAMPLE_SIGMA || Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
      blurScale = 1
      captureBlur = null
      captureEffect = BackdropEffects.build(params(origin = sampleMargin))
      return
    }
    // Keep sigma >= 2 at the small size: below that the scaled-up blur shows its pixels.
    blurScale = (sigma / MIN_SMALL_SIGMA).toInt().coerceIn(1, MAX_BLUR_SCALE)
    val small = ((sigma / blurScale - 0.5f) / BLUR_SIGMA_SCALE).coerceAtLeast(0.1f)
    val tile = params().tileMode
    captureBlur = RenderEffect.createBlurEffect(small, small, tile)
    // The glass node is the glass's own size here (the margin is only the blur's sampling room,
    // and the lens never samples outside the glass), so the shader runs on no extra pixels.
    captureEffect = if (effect == "liquid-blur") BackdropEffects.build(params().copy(name = "liquid")) else null
  }

  /** How far the glass node reaches past the glass: the margin, unless the blur is downsampled. */
  private val nodeMargin: Float
    get() = if (captureBlur != null) 0f else sampleMargin

  /** Room around the glass that a blurring effect samples (real pixels, not clamped edges). */
  private val sampleMargin: Float
    get() = if (effect in BLURRING_EFFECTS) ceil(effectiveBlur * density * 2f) else 0f

  /** The mode the last `onBackdropStatus` reported. */
  private var reportedMode: BackdropMode? = null

  private fun onSourceChanged() {
    // The source appeared or went away after the last commit: re-apply and report the new mode.
    if (width > 0 && reportedMode != null && mode != reportedMode) {
      commit()
      return
    }
    if (mode == BackdropMode.CAPTURE && !captureReady && width > 0) {
      try {
        applyBackdrop()
      } catch (t: Throwable) {
        Log.w(TAG, "effect=$effect failed", t)
      }
    }
    invalidate()
  }

  private var capturedThisFrame = false

  override fun draw(canvas: Canvas) {
    capturedThisFrame = false
    if (mode == BackdropMode.CAPTURE) drawCapturedBackdrop(canvas)
    super.draw(canvas)
  }

  /**
   * Draws this glass's processed backdrop (capture path, as drawn this frame) and its tint into
   * [canvas], view-local: what an inner glass (the tab bar's droplet) refracts. False when there
   * is none.
   */
  protected fun drawProcessedBackdrop(canvas: Canvas): Boolean {
    val node = captureBackdropNode ?: return false
    if (!capturedThisFrame) return false
    val m = nodeMargin
    val save = canvas.save()
    canvas.translate(-m, -m)
    canvas.drawRenderNode(node)
    canvas.restoreToCount(save)
    if (labEffect != null) tintColor?.let { canvas.drawColor(it) }
    return true
  }

  private fun drawCapturedBackdrop(canvas: Canvas) {
    val node = captureBackdropNode ?: return
    if (!captureReady) return
    if (!canvas.isHardwareAccelerated || width == 0 || height == 0) return

    val blur = captureBlur
    val small = captureBlurNode
    val m = nodeMargin
    node.setPosition(0, 0, (width + 2 * m).toInt(), (height + 2 * m).toInt())
    if (blur != null && small != null) {
      // The source and its sampling margin at 1/k size, blurred there, then drawn k times larger
      // into the glass node (the glass's size: the margin falls outside it).
      val sm = sampleMargin
      val k = blurScale.toFloat()
      small.setPosition(0, 0, ceil((width + 2 * sm) / k).toInt(), ceil((height + 2 * sm) / k).toInt())
      val smallRec = small.beginRecording()
      try {
        smallRec.scale(1f / k, 1f / k)
        smallRec.translate(sm, sm)
        if (!sourceBackdrop.draw(smallRec)) return
      } finally {
        small.endRecording()
      }
      small.setRenderEffect(blur)
      small.pivotX = 0f
      small.pivotY = 0f
      small.scaleX = k
      small.scaleY = k
      val recording = node.beginRecording()
      try {
        recording.translate(-sm, -sm)
        recording.drawRenderNode(small)
      } finally {
        node.endRecording()
      }
    } else {
      val recording = node.beginRecording()
      try {
        recording.translate(m, m)
        if (!sourceBackdrop.draw(recording)) return
      } finally {
        node.endRecording()
      }
    }
    node.setRenderEffect(captureEffect)
    capturedThisFrame = true

    val save = canvas.save()
    // Only the glass: the margin is sampling room, and a plain blur also follows the corners.
    val r = (cornerRadius * density).coerceAtMost(minOf(width, height) / 2f)
    clipPath.reset()
    clipPath.addRoundRect(0f, 0f, width.toFloat(), height.toFloat(), r, r, Path.Direction.CW)
    canvas.clipPath(clipPath)
    canvas.translate(-m, -m)
    canvas.drawRenderNode(node)
    canvas.restoreToCount(save)
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    sourceBackdrop.attach()
  }

  // --- Press interaction (Kyant's LiquidButton) ---

  override fun onTouchEvent(event: MotionEvent): Boolean {
    if (!interactive || !isEnabled) return super.onTouchEvent(event)
    when (event.actionMasked) {
      MotionEvent.ACTION_DOWN -> press.down(event.x, event.y)
      MotionEvent.ACTION_MOVE -> press.move(event.x, event.y)
      MotionEvent.ACTION_UP -> {
        val inside = event.x in 0f..width.toFloat() && event.y in 0f..height.toFloat()
        press.release()
        if (inside) performClick()
      }
      MotionEvent.ACTION_CANCEL -> press.release()
    }
    return true
  }

  override fun performClick(): Boolean {
    super.performClick()
    onPress(emptyMap())
    return true
  }

  /** LiquidButton's layerBlock: swell, lean and stretch, then redraw the glass. */
  private fun onPressFrame() {
    val w = width.toFloat()
    val h = height.toFloat()
    if (w == 0f || h == 0f) return
    val progress = press.progress
    val scale = 1f + (4f * density / h) * progress
    val maxOffset = min(w, h)
    val ox = press.offsetX
    val oy = press.offsetY
    translationX = maxOffset * tanh(0.05f * ox / maxOffset)
    translationY = maxOffset * tanh(0.05f * oy / maxOffset)
    val maxDragScale = 4f * density / h
    val angle = atan2(oy, ox)
    scaleX = scale + maxDragScale * abs(cos(angle) * ox / max(w, h)) * min(w / h, 1f)
    scaleY = scale + maxDragScale * abs(sin(angle) * oy / max(w, h)) * min(h / w, 1f)
    try {
      applyBackdrop()
    } catch (t: Throwable) {
      Log.w(TAG, "press frame failed", t)
    }
  }

  /** Where the glass shader lights up, and how much (0..1). Subclasses move it. */
  protected open val highlightProgress: Float get() = if (interactive) press.progress else 0f
  protected open val highlightX: Float get() = press.touchX
  protected open val highlightY: Float get() = press.touchY

  private fun resetPress() {
    press.stop()
    translationX = 0f
    translationY = 0f
    scaleX = 1f
    scaleY = 1f
  }

  override fun onDetachedFromWindow() {
    press.stop()
    sourceBackdrop.detach()
    super.onDetachedFromWindow()
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    if (w != oldw || h != oldh) commit()
  }

  // ExpoView is a LinearLayout: its onLayout would stack the React children at the top-left
  // and undo the positions React Native gave them. React Native lays them out; do nothing here.
  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) = Unit

  private val strokePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.STROKE }

  // ExpoView ignores the border styles, so the outline of the glass is drawn here, over the
  // children (lab aid: shows the view's bounds even when the effect draws nothing).
  override fun dispatchDraw(canvas: Canvas) {
    super.dispatchDraw(canvas)
    val color = strokeColor ?: return
    strokePaint.color = color
    strokePaint.strokeWidth = density
    val inset = density / 2 + margin * density
    val r = cornerRadius * density
    canvas.drawRoundRect(inset, inset, width - inset, height - inset, r, r, strokePaint)
  }

  private fun params(origin: Float = 0f) = EffectParams(
    // RuntimeShader needs API 33: on 31–32 the liquid glass becomes a plain blur.
    name = if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU && effect.startsWith("liquid")) "blur" else effect,
    origin = origin,
    radius = effectiveBlur * density,
    tileMode = when (tileMode) {
      "mirror" -> Shader.TileMode.MIRROR
      "repeat" -> Shader.TileMode.REPEAT
      "decal" -> Shader.TileMode.DECAL
      else -> Shader.TileMode.CLAMP
    },
    offsetX = offsetX * density,
    offsetY = offsetY * density,
    cornerRadius = cornerRadius * density,
    height = refractionHeight * density,
    amount = amount * density,
    width = width.toFloat(),
    heightPx = height.toFloat(),
    margin = margin * density,
    uniforms = if (labEffect == null) styleUniforms() + uniforms else uniforms,
    press = highlightProgress,
    touchX = highlightX,
    touchY = highlightY,
  )

  private companion object {
    const val TAG = "GlassLab"
    const val BLUR_SIGMA_SCALE = 0.57735f
    const val MIN_SMALL_SIGMA = 2f
    const val MIN_DOWNSAMPLE_SIGMA = 6f
    const val MAX_BLUR_SCALE = 4
    val BLURRING_EFFECTS = setOf(
      "blur", "blur-input", "blur-saturate", "lens-blur", "liquid-blur", "blur-then-shift", "lens-blur-open",
    )
  }
}

/** Default colours of the glass components. */
enum class GlassTheme(
  /** Shown instead of the glass where there is no backdrop. */
  val fallback: Int,
  /** Tab bar selection, slider fill. */
  val accent: Int,
  /** Switch track when on. */
  val switchAccent: Int,
  /** Switch / slider track. */
  val track: Int,
  /** The tab bar's droplet at rest (pressed: 3% of the same colour). */
  val droplet: Int,
) {
  LIGHT(0xCCF2F2F7.toInt(), 0xFF0088FF.toInt(), 0xFF34C759.toInt(), 0x33787878, 0xFF000000.toInt()),
  DARK(0xCC1C1C1E.toInt(), 0xFF0091FF.toInt(), 0xFF30D158.toInt(), 0x5C787880, 0xFFFFFFFF.toInt());

  companion object {
    fun of(name: String?) = if (name == "dark") DARK else LIGHT
  }
}

/**
 * iOS-like glass presets, fitted to UIGlassEffect (iOS 26.4): the same photos behind
 * expo-glass-effect's GlassView and this glass, pixel-aligned, and the shader's model
 * (blurred backdrop, saturation, mixed towards a surface colour) solved for the values that
 * reproduce Apple's pixels. Lens and rim were matched on row-by-row brightness profiles across
 * the glass (see example/src/app/glass-compare.tsx).
 */
enum class GlassEffectStyle(
  /** dp (Skia sigma ≈ 0.58 × this + 0.5). */
  val blur: Float,
  /** dp: how far in from the edge the lens bends, the same at every glass size. */
  val lensBand: Float,
  private val lightTint: Int,
  private val darkTint: Int,
  val uniforms: Map<String, Float>,
  private val lightUniforms: Map<String, Float> = emptyMap(),
  private val darkUniforms: Map<String, Float> = emptyMap(),
  /** The look of tall glass (iOS frosts it more); null: the same at every size. */
  private val large: LargeLook? = null,
) {
  REGULAR(
    // iOS: Gaussian ~3pt, 72% neutral light grey (light) / 57% dark grey (dark).
    blur = 5.2f,
    lensBand = 18f,
    lightTint = 0xB8E0E1E0.toInt(),
    darkTint = 0x91292E2B.toInt(),
    uniforms = mapOf(
      // The outer band (lensBand) bends, ramping evenly and turning over vertically at the rim
      // (iOS reflects what lies across the glass's height); the horizontal bend keeps a narrow
      // band so the rounded ends don't swirl.
      "lensMirror" to 1f, "lensCurve" to 0.5f, "lensXRatio" to 0.5f,
      "dispersion" to 0.0005f, "bendSplit" to 0.15f, "edgeHighlight" to 1.2f,
      "rimStrength" to 0.03f, "fresnelAmount" to 0.15f,
      // A ~1pt rim, as bright at the bottom as at the top (strength per theme below).
      "maskSharpness" to 100f, "ringWidth" to 0.016f,
    ),
    // iOS light keeps more of the colour behind the frost; dark slightly less. The rim is as
    // bright at the bottom as at the top.
    lightUniforms = mapOf("saturation" to 1.4f, "ringStrength" to 0.13f),
    darkUniforms = mapOf("saturation" to 0.9f, "ringStrength" to 0.12f),
    // Measured on UIGlassEffect.regular at 44–240pt tall (width made no difference): up to
    // ~61pt it is the look above; from ~90pt the surface is whiter (light) or darker and more
    // opaque (dark) with more colour kept, and the blur keeps growing up to ~180pt.
    large = LargeLook(
      lightTint = 0xB8F8FAF7.toInt(),
      darkTint = 0xC7272926.toInt(),
      lightUniforms = mapOf("saturation" to 2f),
      darkUniforms = mapOf("saturation" to 2f),
      // (height dp, blur dp): iOS Gaussian ~3pt up to 90pt, ~5pt at 120pt, ~7pt from 180pt.
      blurByHeight = listOf(90f to 5.2f, 120f to 8.6f, 180f to 12f),
    ),
  ),
  CLEAR(
    // iOS: Gaussian ~1.5pt, no surface colour, an even 7.6% lift, the same look in both themes.
    blur = 2.5f,
    lensBand = 20f,
    lightTint = 0x00FFFFFF,
    darkTint = 0x00000000,
    uniforms = mapOf(
      // The lens bends the outer band (lensBand) and turns over vertically at the rim (iOS
      // reflects what lies across the glass there); the middle is left untouched, as on iOS.
      "lensMirror" to 1f, "lensCurve" to 0.5f, "lensXRatio" to 0.25f,
      "dispersion" to 0.0003f, "bendSplit" to 0.15f, "edgeHighlight" to 1.5f,
      "rimStrength" to 0.05f, "fresnelAmount" to 0.2f, "gain" to 1.03f, "lift" to 0.076f,
      "maskSharpness" to 100f, "ringWidth" to 0.016f, "ringStrength" to 0.14f,
    ),
  );

  /** 0 for short glass, 1 for tall: iOS switches between ~61pt and ~90pt. */
  private fun largeness(heightDp: Float): Float {
    if (large == null) return 0f
    val t = ((heightDp - LARGE_FROM) / (LARGE_TO - LARGE_FROM)).coerceIn(0f, 1f)
    return t * t * (3f - 2f * t)
  }

  fun blurFor(heightDp: Float): Float {
    val points = large?.blurByHeight ?: return blur
    if (heightDp <= points.first().first) return blur
    for (i in 1 until points.size) {
      val (h0, b0) = points[i - 1]
      val (h1, b1) = points[i]
      if (heightDp <= h1) return b0 + (b1 - b0) * (heightDp - h0) / (h1 - h0)
    }
    return points.last().second
  }

  fun tint(theme: GlassTheme, heightDp: Float = 0f): Int {
    val small = if (theme == GlassTheme.DARK) darkTint else lightTint
    val look = large ?: return small
    return lerpColor(small, if (theme == GlassTheme.DARK) look.darkTint else look.lightTint, largeness(heightDp))
  }

  /** The style's shader values for a theme and height. */
  fun uniforms(theme: GlassTheme, heightDp: Float = 0f): Map<String, Float> {
    val small = uniforms + if (theme == GlassTheme.DARK) darkUniforms else lightUniforms
    val look = large ?: return small
    val t = largeness(heightDp)
    if (t <= 0f) return small
    val target = if (theme == GlassTheme.DARK) look.darkUniforms else look.lightUniforms
    return small + target.mapValues { (k, v) -> (small[k] ?: LiquidGlassShader.DEFAULTS[k] ?: v).let { it + (v - it) * t } }
  }

  companion object {
    fun of(name: String?) = if (name == "clear") CLEAR else REGULAR

    private const val LARGE_FROM = 64f
    private const val LARGE_TO = 88f

    private fun lerpColor(a: Int, b: Int, t: Float): Int {
      fun ch(shift: Int) = ((a ushr shift and 0xFF) + ((b ushr shift and 0xFF) - (a ushr shift and 0xFF)) * t).roundToInt()
      return (ch(24) shl 24) or (ch(16) shl 16) or (ch(8) shl 8) or ch(0)
    }
  }
}

/** A style's look on tall glass (see [GlassEffectStyle]). */
class LargeLook(
  val lightTint: Int,
  val darkTint: Int,
  val lightUniforms: Map<String, Float>,
  val darkUniforms: Map<String, Float>,
  /** Ascending (height dp, blur dp) points; the style's blur below the first. */
  val blurByHeight: List<Pair<Float, Float>>,
)

/** How a glass gets what is behind it. */
internal enum class BackdropMode { PLATFORM, CAPTURE, FLAT
}
