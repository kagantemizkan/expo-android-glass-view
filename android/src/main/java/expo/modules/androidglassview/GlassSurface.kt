package expo.modules.androidglassview

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.isSpecified
import androidx.compose.ui.unit.dp
import expo.modules.androidglassview.backdrop.Backdrop
import expo.modules.androidglassview.backdrop.BackdropEffectScope
import expo.modules.androidglassview.backdrop.drawBackdrop
import expo.modules.androidglassview.backdrop.effects.blur
import expo.modules.androidglassview.backdrop.effects.lens
import expo.modules.androidglassview.backdrop.effects.vibrancy
import expo.modules.androidglassview.backdrop.highlight.Highlight
import expo.modules.androidglassview.backdrop.isRenderEffectSupported
import expo.modules.androidglassview.backdrop.shadow.Shadow

/** Glass parameters set from React props. Lengths are in dp, like React Native styles. */
internal class GlassState {
  var cornerRadius by mutableFloatStateOf(DEFAULT_CORNER_RADIUS)
  var blurRadius by mutableFloatStateOf(DEFAULT_BLUR_RADIUS)
  var refractionHeight by mutableFloatStateOf(DEFAULT_REFRACTION_HEIGHT)
  var refractionAmount by mutableFloatStateOf(DEFAULT_REFRACTION_AMOUNT)
  var chromaticAberration by mutableStateOf(false)
  var depthEffect by mutableStateOf(false)
  var vibrancy by mutableStateOf(true)
  var highlight by mutableStateOf(true)
  var shadow by mutableStateOf(true)
  var tintColor by mutableStateOf(Color.Unspecified)
  var surfaceColor by mutableStateOf(Color.Unspecified)
  var fallbackColor by mutableStateOf(DEFAULT_FALLBACK_COLOR)

  companion object {
    // Same defaults as Kyant's LiquidButton sample.
    const val DEFAULT_CORNER_RADIUS = 24f
    const val DEFAULT_BLUR_RADIUS = 2f
    const val DEFAULT_REFRACTION_HEIGHT = 12f
    const val DEFAULT_REFRACTION_AMOUNT = 24f
    val DEFAULT_FALLBACK_COLOR = Color(0xB3FFFFFF)
  }
}

/** Vibrancy, blur and lens as configured by [state]. */
internal fun BackdropEffectScope.glassEffects(state: GlassState) {
  if (state.vibrancy) vibrancy()
  val blurRadius = state.blurRadius
  if (blurRadius > 0f) blur(blurRadius.dp.toPx())
  val refractionHeight = state.refractionHeight
  val refractionAmount = state.refractionAmount
  if (refractionHeight > 0f && refractionAmount > 0f) {
    lens(
      refractionHeight = refractionHeight.dp.toPx(),
      refractionAmount = refractionAmount.dp.toPx(),
      depthEffect = state.depthEffect,
      chromaticAberration = state.chromaticAberration
    )
  }
}

/** Fallback, tint and surface colours painted over the backdrop, as configured by [state]. */
internal fun DrawScope.glassSurface(state: GlassState, effectsSupported: Boolean) {
  if (!effectsSupported) drawRect(state.fallbackColor)
  val tint = state.tintColor
  if (tint.isSpecified) {
    drawRect(tint, blendMode = BlendMode.Hue)
    drawRect(tint.copy(alpha = 0.75f * tint.alpha))
  }
  val surface = state.surfaceColor
  if (surface.isSpecified) drawRect(surface)
}

@Composable
internal fun GlassSurface(state: GlassState, backdrop: Backdrop) {
  val effectsSupported = isRenderEffectSupported()
  Box(
    Modifier
      .fillMaxSize()
      .drawBackdrop(
        backdrop = backdrop,
        shape = { RoundedCornerShape(state.cornerRadius.dp) },
        effects = { glassEffects(state) },
        highlight = { if (state.highlight) Highlight.Default else null },
        shadow = { if (state.shadow) Shadow.Default else null },
        onDrawSurface = { glassSurface(state, effectsSupported) }
      )
  )
}
