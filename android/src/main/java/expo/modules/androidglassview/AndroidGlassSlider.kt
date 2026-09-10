package expo.modules.androidglassview

import android.annotation.SuppressLint
import android.content.Context
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import expo.modules.androidglassview.components.LiquidSlider
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher

/** Kyant's LiquidSlider: the thumb turns into refracting glass while dragged. */
@SuppressLint("ViewConstructor")
class AndroidGlassSlider(context: Context, appContext: AppContext) : GlassHostView(context, appContext) {

  override val claimsHorizontalDrags: Boolean = true

  internal var value by mutableFloatStateOf(0f)
    private set
  internal var minimumValue by mutableFloatStateOf(0f)
  internal var maximumValue by mutableFloatStateOf(1f)
  internal var accentColor by mutableStateOf<Color?>(null)
  internal var trackColor by mutableStateOf<Color?>(null)

  /**
   * The `value` prop. While a finger is on the slider it is driven natively; after that the prop
   * wins again once JS has handled every event the slider sent, `onSlidingComplete` included, so
   * a value set there (e.g. a rounded one) is not overtaken by an older one.
   */
  internal val valueProp = ControlledProp(0f)
  private var dragging = false

  private val onValueChange by EventDispatcher()
  private val onSlidingComplete by EventDispatcher()
  private val valueProvider: () -> Float = { value }

  /** Called once all props of an update are set. */
  internal fun applyProps() {
    if (!dragging && valueProp.isCurrent) value = valueProp.value
  }

  @Composable
  override fun GlassContent() {
    val min = minimumValue
    val max = if (maximumValue > min) maximumValue else min + 1f
    // The drag animation captures its range when created, so rebuild it when the range changes.
    key(min, max) {
      Box(Modifier.fillMaxSize(), contentAlignment = Alignment.CenterStart) {
        LiquidSlider(
          value = valueProvider,
          onValueChange = { newValue ->
            if (newValue != value) {
              value = newValue
              onValueChange(
                mapOf("value" to newValue.toDouble(), "eventCount" to valueProp.nextEventCount())
              )
            }
          },
          onValueChangeFinished = {
            dragging = false
            onSlidingComplete(
              mapOf("value" to value.toDouble(), "eventCount" to valueProp.nextEventCount())
            )
          },
          onDragStarted = { dragging = true },
          valueRange = min..max,
          visibilityThreshold = (max - min) * 0.0001f,
          backdrop = backdrop,
          modifier = Modifier.fillMaxSize(),
          accentColor = accentColor,
          trackColor = trackColor
        )
      }
    }
  }
}
