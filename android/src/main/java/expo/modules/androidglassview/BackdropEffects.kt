package expo.modules.androidglassview

import android.graphics.BlendMode
import android.graphics.Color
import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.graphics.LinearGradient
import android.graphics.RenderEffect
import android.graphics.RuntimeShader
import android.graphics.Shader
import android.os.Build

/** Everything a test case can ask for, in pixels. */
internal data class EffectParams(
  val name: String,
  val radius: Float,
  val tileMode: Shader.TileMode,
  val offsetX: Float,
  val offsetY: Float,
  val cornerRadius: Float,
  val height: Float,
  val amount: Float,
  val width: Float,
  val heightPx: Float,
  /** The visible glass is inset this far (px) inside the view; the rest is sampling room. */
  val margin: Float = 0f,
  /** Extra shader uniforms by name (e.g. the liquid glass look); unset ones use defaults. */
  val uniforms: Map<String, Float> = emptyMap(),
  /** Press progress (0..1) and finger position (px) of a pressable glass. */
  val press: Float = 0f,
  val touchX: Float = 0f,
  val touchY: Float = 0f,
  /** Where the glass's top-left is inside the effect's node (the capture path's sampling margin). */
  val origin: Float = 0f,
)

/**
 * Builds the RenderEffect a lab case names. Each one probes one question about the backdrop:
 * does that effect type work there at all, which coordinates does it see, can it sample outside
 * the view's bounds.
 */
internal object BackdropEffects {

  fun build(p: EffectParams): RenderEffect? {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return null
    return when (p.name) {
      "none" -> null
      // The plain 3-argument blur (no input effect).
      "blur" -> RenderEffect.createBlurEffect(p.radius, p.radius, p.tileMode)
      // The 4-argument blur the docs name, with an explicit (identity) input effect.
      "blur-input" -> RenderEffect.createBlurEffect(
        p.radius, p.radius, RenderEffect.createOffsetEffect(0f, 0f), p.tileMode
      )
      // Shifts the backdrop: shows whether pixels from outside the view's bounds are available.
      "offset" -> RenderEffect.createOffsetEffect(p.offsetX, p.offsetY)
      "saturate" -> RenderEffect.createColorFilterEffect(saturation(2.2f))
      // Vibrancy: blur first, then boost saturation.
      "blur-saturate" -> RenderEffect.createChainEffect(
        RenderEffect.createColorFilterEffect(saturation(1.8f)),
        RenderEffect.createBlurEffect(p.radius, p.radius, p.tileMode)
      )
      // A shader effect ignores its input: does it simply replace the backdrop?
      "shader-gradient" -> RenderEffect.createShaderEffect(
        LinearGradient(0f, 0f, p.width, p.heightPx, Color.MAGENTA, Color.CYAN, Shader.TileMode.CLAMP)
      )
      "agsl-invert" -> runtime(INVERT, p)
      "agsl-coords" -> runtime(COORDS, p)
      "agsl-magnify" -> runtime(MAGNIFY, p)
      "agsl-lens" -> runtime(LENS, p)
      "agsl-chroma" -> runtime(CHROMA, p)
      // Same shift as "offset", but done by sampling in a runtime shader: can a shader read
      // backdrop pixels outside the view's bounds?
      "agsl-shift" -> runtime(SHIFT, p)
      // A blur whose output is shifted: does the blurred backdrop extend past the bounds?
      "blur-then-shift" -> runtime(SHIFT, p)?.let { shift ->
        RenderEffect.createChainEffect(shift, RenderEffect.createBlurEffect(p.radius, p.radius, p.tileMode))
      }
      // Blur, then refract the blurred backdrop: the shape of a real glass pipeline.
      "lens-blur" -> runtime(LENS, p)?.let { lens ->
        RenderEffect.createChainEffect(lens, RenderEffect.createBlurEffect(p.radius, p.radius, p.tileMode))
      }
      // Lens that leaves everything outside the glass shape untouched (identity), so the view
      // can be larger than the glass without clipping: the margin is sampling room.
      "lens-open" -> runtime(LENS_OPEN, p)
      // blur -> lens inside the shape, original backdrop outside it: the lens outputs alpha 0
      // outside the shape and is drawn (SRC_OVER) over the untouched backdrop.
      "lens-blur-open" -> runtime(LENS_MASKED, p)?.let { lens ->
        RenderEffect.createBlendModeEffect(
          RenderEffect.createOffsetEffect(0f, 0f),
          RenderEffect.createChainEffect(lens, RenderEffect.createBlurEffect(p.radius, p.radius, p.tileMode)),
          BlendMode.SRC_OVER
        )
      }
      // arya3d/liquid-glass-webgpu, ported (see LiquidGlassShader).
      "liquid" -> runtime(LiquidGlassShader.SOURCE, p)
      // The same glass over a lightly blurred backdrop.
      "liquid-blur" -> runtime(LiquidGlassShader.SOURCE, p)?.let { glass ->
        RenderEffect.createChainEffect(glass, RenderEffect.createBlurEffect(p.radius, p.radius, p.tileMode))
      }
      else -> throw IllegalArgumentException("Unknown effect '${p.name}'")
    }
  }

  private val FLOAT_UNIFORM = Regex("""uniform\s+float\s+(\w+)\s*;""")

  private fun saturation(value: Float) =
    ColorMatrixColorFilter(ColorMatrix().apply { setSaturation(value) })

  /**
   * One compiled shader per source, with the `uniform float` names it declares. Building a
   * RuntimeShader compiles its AGSL, and the pressed thumbs and the tab bar's droplet rebuild their
   * effect every frame, so compiling each time cost frames (a slider dragged quickly stuttered).
   * Reusing the instance is safe: every uniform is set again below on each call, and
   * createRuntimeShaderEffect takes a copy of the values, so effects already built keep theirs.
   * Main thread only, like the rest of the view code.
   */
  private class CompiledShader(val shader: RuntimeShader, val floatUniforms: List<String>)

  private val compiled = HashMap<String, CompiledShader>()

  private fun runtime(source: String, p: EffectParams): RenderEffect? {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
      throw UnsupportedOperationException("RuntimeShader needs API 33")
    }
    val entry = compiled.getOrPut(source) {
      CompiledShader(RuntimeShader(source), FLOAT_UNIFORM.findAll(source).map { it.groupValues[1] }.toList())
    }
    val shader = entry.shader
    shader.setFloatUniform("size", p.width, p.heightPx)
    if (source.contains("uniform float2 touch")) shader.setFloatUniform("touch", p.touchX, p.touchY)
    if (source.contains("uniform float2 origin")) shader.setFloatUniform("origin", p.origin, p.origin)
    // Every other `uniform float` the source declares, by name.
    for (name in entry.floatUniforms) {
      val value = when (name) {
        "radius" -> p.cornerRadius
        "height" -> p.height
        "amount" -> p.amount
        "margin" -> p.margin
        "press" -> p.press
        else -> p.uniforms[name] ?: LiquidGlassShader.DEFAULTS[name]
          ?: throw IllegalArgumentException("No value for uniform '$name'")
      }
      shader.setFloatUniform(name, value)
    }
    return RenderEffect.createRuntimeShaderEffect(shader, "content")
  }

  private const val INVERT = """
    uniform shader content;
    uniform float2 size;
    half4 main(float2 p) {
      half4 c = content.eval(p);
      return half4(c.a - c.rgb, c.a);
    }
  """

  // Red = x / width, green = y / height, mixed half-and-half over the backdrop. Blue grid lines
  // every 50 px make the origin and the scale visible.
  private const val COORDS = """
    uniform shader content;
    uniform float2 size;
    half4 main(float2 p) {
      half4 c = content.eval(p);
      half2 uv = half2(clamp(p / size, 0.0, 1.0));
      half4 debug = half4(uv.x, uv.y, 0.0, 1.0);
      float2 g = abs(fract(p / 50.0) - 0.5);
      if (min(g.x, g.y) > 0.47) debug = half4(0.0, 0.0, 1.0, 1.0);
      return mix(c, debug, 0.5);
    }
  """

  // Scales the backdrop up around the centre (a magnifying glass).
  private const val MAGNIFY = """
    uniform shader content;
    uniform float2 size;
    uniform float amount;
    half4 main(float2 p) {
      float2 c = size * 0.5;
      return content.eval(c + (p - c) / (1.0 + amount));
    }
  """

  // Rim refraction of a rounded rectangle: within `height` px of the edge, the backdrop is sampled
  // up to `amount` px further OUT along the edge normal, so it pulls in pixels from outside the
  // view's bounds.
  private const val LENS = """
    uniform shader content;
    uniform float2 size;
    uniform float radius;
    uniform float height;
    uniform float amount;
    uniform float margin;

    float sdRoundRect(float2 p, float2 b, float r) {
      float2 q = abs(p) - b + r;
      return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
    }

    half4 main(float2 coord) {
      float2 c = size * 0.5;
      float2 hs = c - margin;
      float2 p = coord - c;
      float d = sdRoundRect(p, hs, radius);
      float t = clamp(1.0 + d / height, 0.0, 1.0);
      float2 e = float2(1.0, 0.0);
      float2 g = float2(
        sdRoundRect(p + e.xy, hs, radius) - sdRoundRect(p - e.xy, hs, radius),
        sdRoundRect(p + e.yx, hs, radius) - sdRoundRect(p - e.yx, hs, radius));
      float2 n = length(g) > 0.0 ? normalize(g) : float2(0.0);
      return content.eval(coord + n * amount * t * t);
    }
  """

  // LENS, but outside the glass shape it returns the backdrop unchanged.
  private const val LENS_OPEN = """
    uniform shader content;
    uniform float2 size;
    uniform float radius;
    uniform float height;
    uniform float amount;
    uniform float margin;

    float sdRoundRect(float2 p, float2 b, float r) {
      float2 q = abs(p) - b + r;
      return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
    }

    half4 main(float2 coord) {
      float2 c = size * 0.5;
      float2 hs = c - margin;
      float2 p = coord - c;
      float d = sdRoundRect(p, hs, radius);
      if (d > 0.0) return content.eval(coord);
      float t = clamp(1.0 + d / height, 0.0, 1.0);
      float2 e = float2(1.0, 0.0);
      float2 g = float2(
        sdRoundRect(p + e.xy, hs, radius) - sdRoundRect(p - e.xy, hs, radius),
        sdRoundRect(p + e.yx, hs, radius) - sdRoundRect(p - e.yx, hs, radius));
      float2 n = length(g) > 0.0 ? normalize(g) : float2(0.0);
      return content.eval(coord + n * amount * t * t);
    }
  """

  // LENS, with alpha 0 outside the glass shape (anti-aliased edge), for blending.
  private const val LENS_MASKED = """
    uniform shader content;
    uniform float2 size;
    uniform float radius;
    uniform float height;
    uniform float amount;
    uniform float margin;

    float sdRoundRect(float2 p, float2 b, float r) {
      float2 q = abs(p) - b + r;
      return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
    }

    half4 main(float2 coord) {
      float2 c = size * 0.5;
      float2 hs = c - margin;
      float2 p = coord - c;
      float d = sdRoundRect(p, hs, radius);
      float t = clamp(1.0 + d / height, 0.0, 1.0);
      float2 e = float2(1.0, 0.0);
      float2 g = float2(
        sdRoundRect(p + e.xy, hs, radius) - sdRoundRect(p - e.xy, hs, radius),
        sdRoundRect(p + e.yx, hs, radius) - sdRoundRect(p - e.yx, hs, radius));
      float2 n = length(g) > 0.0 ? normalize(g) : float2(0.0);
      half4 col = content.eval(coord + n * amount * t * t);
      return col * half(clamp(0.5 - d, 0.0, 1.0));
    }
  """

  // Reads the backdrop `amount` px up and to the left (like createOffsetEffect(amount, amount)).
  private const val SHIFT = """
    uniform shader content;
    uniform float2 size;
    uniform float amount;
    half4 main(float2 p) {
      return content.eval(p - float2(amount, amount));
    }
  """

  // Splits red and blue outwards / inwards from the centre.
  private const val CHROMA = """
    uniform shader content;
    uniform float2 size;
    uniform float amount;
    half4 main(float2 p) {
      float2 c = size * 0.5;
      float2 o = (p - c) / max(size.x, size.y) * amount;
      half4 g = content.eval(p);
      return half4(content.eval(p + o).r, g.g, content.eval(p - o).b, g.a);
    }
  """
}
