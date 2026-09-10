package expo.modules.androidglassview

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.view.View
import android.view.ViewGroup
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.util.lerp
import expo.modules.androidglassview.components.LiquidBottomTabs
import expo.modules.androidglassview.components.TabsFrame
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher

/**
 * Kyant's LiquidBottomTabs: a glass tab bar with a draggable liquid selection droplet. The React
 * children are the tabs (one child per tab, equal widths); they are drawn inside the glass, and
 * again in the accent colour under the droplet.
 */
@SuppressLint("ViewConstructor")
class AndroidGlassBottomTabs(context: Context, appContext: AppContext) : GlassHostView(context, appContext) {

  override val drawsReactChildrenInCompose: Boolean = true
  override val claimsHorizontalDrags: Boolean = true

  internal var selectedIndex by mutableIntStateOf(0)
    private set
  internal var tabsCount by mutableIntStateOf(1)
  internal var accentColor by mutableStateOf<Color?>(null)
  internal var containerColor by mutableStateOf<Color?>(null)

  /** The `selectedIndex` prop; it only wins once JS has handled every selection made on the bar. */
  internal val selectedIndexProp = ControlledProp(0)

  internal var minimized by mutableStateOf(false)
    private set
  private var minimizedProp = false

  private val onTabSelected by EventDispatcher()
  private val onMinimizedChange by EventDispatcher()
  private val selectedIndexProvider: () -> Int = { selectedIndex }
  private val minimizedProvider: () -> Boolean = { minimized }

  // Touching a minimized bar brings it back, like on iOS; JS is told so it can stay in sync.
  private val expand: () -> Unit = {
    if (minimized) {
      minimized = false
      onMinimizedChange(mapOf("minimized" to false))
    }
  }

  /** Called once all props of an update are set. */
  internal fun applyProps() {
    if (selectedIndexProp.isCurrent) selectedIndex = selectedIndexProp.value
  }

  /**
   * Applies the `minimized` prop. Only a change counts: the bar also expands by itself when
   * touched, and then stays expanded until JS minimizes it again.
   */
  internal fun setMinimizedProp(value: Boolean) {
    if (value != minimizedProp) {
      minimizedProp = value
      minimized = value
    }
  }

  @Composable
  override fun GlassContent() {
    LiquidBottomTabs(
      selectedTabIndex = selectedIndexProvider,
      onTabSelected = { index ->
        // Selections that came from the `selectedIndex` prop are not echoed back to JS.
        if (index != selectedIndex) {
          selectedIndex = index
          onTabSelected(mapOf("index" to index, "eventCount" to selectedIndexProp.nextEventCount()))
        }
      },
      backdrop = backdrop,
      tabsCount = tabsCount.coerceAtLeast(1),
      drawTabs = { origin, frame, tint, scale ->
        // Reading the generation subscribes this draw to changes of the React children.
        if (reactChildrenGeneration >= 0) {
          drawReactLayer(origin, tint) { canvas -> drawTabsInto(canvas, frame, scale) }
        }
      },
      modifier = Modifier.fillMaxSize(),
      minimized = minimizedProvider,
      onExpand = expand,
      accentColor = accentColor,
      containerColor = containerColor
    )
  }

  /**
   * Draws the tabs in [frame]'s slots. React Native lays them out for the expanded bar, so while
   * the bar minimizes each tab follows its narrower slot, its first child (the icon) moves to the
   * bar's centre and its other children (the label) fade out. [scale] magnifies each tab.
   */
  private fun drawTabsInto(canvas: Canvas, frame: TabsFrame, scale: Float) {
    val progress = frame.minimizeProgress
    val labelAlpha = 1f - (progress / LABEL_FADE_END).coerceIn(0f, 1f)
    for (i in 0 until reactChildCount) {
      val tab = getReactChildAt(i) ?: continue
      if (tab.visibility != View.VISIBLE) continue
      val left = (tab.left - scrollX).toFloat()
      val top = (tab.top - scrollY).toFloat()
      val width = tab.width.toFloat()
      val height = tab.height.toFloat()
      val icon = (tab as? ViewGroup)?.takeIf { it.childCount > 0 }?.getChildAt(0)
      val iconCenterY = if (icon != null) icon.top + icon.height / 2f else height / 2f
      val centerX = left + width / 2f
      val save = canvas.save()
      canvas.translate(
        left + frame.mapX(centerX) - centerX,
        top + progress * (frame.centerY - (top + iconCenterY))
      )
      val matrix = tab.matrix
      if (!matrix.isIdentity) canvas.concat(matrix)
      if (scale != 1f) canvas.scale(scale, scale, width / 2f, lerp(height / 2f, iconCenterY, progress))
      if (tab is ViewGroup && labelAlpha < 1f) {
        drawFadingChildren(canvas, tab, labelAlpha)
      } else {
        val alpha = tab.alpha
        if (alpha < 1f) canvas.saveLayerAlpha(0f, 0f, width, height, (alpha * 255f).toInt())
        tab.draw(canvas)
      }
      canvas.restoreToCount(save)
    }
  }

  /** Draws [tab]'s children one by one: the first as is, the others at [labelAlpha]. */
  private fun drawFadingChildren(canvas: Canvas, tab: ViewGroup, labelAlpha: Float) {
    for (j in 0 until tab.childCount) {
      val child = tab.getChildAt(j)
      if (child.visibility != View.VISIBLE) continue
      val alpha = tab.alpha * child.alpha * if (j == 0) 1f else labelAlpha
      if (alpha <= 0f) continue
      val save = canvas.save()
      canvas.translate((child.left - tab.scrollX).toFloat(), (child.top - tab.scrollY).toFloat())
      val matrix = child.matrix
      if (!matrix.isIdentity) canvas.concat(matrix)
      if (alpha < 1f) {
        canvas.saveLayerAlpha(0f, 0f, child.width.toFloat(), child.height.toFloat(), (alpha * 255f).toInt())
      }
      child.draw(canvas)
      canvas.restoreToCount(save)
    }
  }

  companion object {
    /** Minimize progress at which the labels are gone. */
    private const val LABEL_FADE_END = 0.4f
  }
}
