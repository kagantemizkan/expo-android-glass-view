package expo.modules.androidglassview

import android.annotation.SuppressLint
import android.content.Context
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import expo.modules.androidglassview.components.LiquidButton
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher

/**
 * Kyant's LiquidButton. The React children (label, icon, …) are drawn inside the glass, so they
 * follow its press and drag deformation.
 */
@SuppressLint("ViewConstructor")
class AndroidGlassButton(context: Context, appContext: AppContext) : GlassHostView(context, appContext) {

  override val drawsReactChildrenInCompose: Boolean = true

  internal val glassState = GlassState().apply { cornerRadius = DEFAULT_CORNER_RADIUS }
  internal var interactive by mutableStateOf(true)

  private val onPress by EventDispatcher()

  @Composable
  override fun GlassContent() {
    LiquidButton(
      onClick = { onPress(emptyMap<String, Any>()) },
      backdrop = backdrop,
      state = glassState,
      isInteractive = interactive,
      drawContent = { drawReactChildren(this@AndroidGlassButton) },
      modifier = Modifier.fillMaxSize()
    )
  }

  companion object {
    /** Capsule: the lens clamps corner radii to half of the shorter side. */
    const val DEFAULT_CORNER_RADIUS = 999f
  }
}
