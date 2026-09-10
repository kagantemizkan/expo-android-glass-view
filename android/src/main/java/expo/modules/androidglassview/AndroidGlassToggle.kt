package expo.modules.androidglassview

import android.annotation.SuppressLint
import android.content.Context
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import expo.modules.androidglassview.components.LiquidToggle
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher

/** Kyant's LiquidToggle: a switch whose thumb turns into refracting glass while dragged. */
@SuppressLint("ViewConstructor")
class AndroidGlassToggle(context: Context, appContext: AppContext) : GlassHostView(context, appContext) {

  override val claimsHorizontalDrags: Boolean = true

  // Not named `selected`: a private setter would clash with View.setSelected().
  internal var checked by mutableStateOf(false)
    private set
  internal var accentColor by mutableStateOf<Color?>(null)
  internal var trackColor by mutableStateOf<Color?>(null)

  /** The `value` prop; it only wins once JS has handled every change made on the switch. */
  internal val valueProp = ControlledProp(false)

  private val onValueChange by EventDispatcher()
  private val checkedProvider: () -> Boolean = { checked }

  /** Called once all props of an update are set. */
  internal fun applyProps() {
    if (valueProp.isCurrent) checked = valueProp.value
  }

  @Composable
  override fun GlassContent() {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.CenterStart) {
      LiquidToggle(
        selected = checkedProvider,
        onSelect = { value ->
          if (value != checked) {
            checked = value
            onValueChange(mapOf("value" to value, "eventCount" to valueProp.nextEventCount()))
          }
        },
        backdrop = backdrop,
        modifier = Modifier.fillMaxSize(),
        accentColor = accentColor,
        trackColor = trackColor
      )
    }
  }
}
