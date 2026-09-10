package expo.modules.androidglassview

import android.annotation.SuppressLint
import android.content.Context
import androidx.compose.runtime.Composable
import expo.modules.kotlin.AppContext

/**
 * Glass container: renders liquid glass behind its React children, which are drawn normally by
 * the view system on top of it (so they stay fully interactive).
 */
@SuppressLint("ViewConstructor")
class AndroidGlassView(context: Context, appContext: AppContext) : GlassHostView(context, appContext) {

  internal val glassState = GlassState()

  @Composable
  override fun GlassContent() {
    GlassSurface(glassState, backdrop)
  }
}
