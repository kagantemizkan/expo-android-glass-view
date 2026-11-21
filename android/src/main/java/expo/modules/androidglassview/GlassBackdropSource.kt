package expo.modules.androidglassview

import android.content.Context
import android.graphics.Canvas
import android.graphics.Matrix
import android.graphics.RenderNode
import android.os.Build
import android.view.View
import android.view.ViewTreeObserver
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView
import java.lang.ref.WeakReference

/**
 * What glass views see behind them on devices without `setBackdropRenderEffect` (below 37.2).
 *
 * Wrap the content that sits behind the glass in a source and give it a name; glass views ask for
 * it by that name (`backdropSource`). The glass must not be inside its own source.
 *
 * Every time this view draws, it records its children a second time into [captureNode]. That
 * records *references* to the children's display lists, not pixels: when a child redraws on its
 * own (a list scrolls, an animation runs), the capture shows it without being recorded again. It
 * is recorded again only when the source itself redraws (layout or children changed).
 */
class GlassBackdropSource(context: Context, appContext: AppContext) : ExpoView(context, appContext) {

  var sourceName: String? = null
    set(value) {
      if (field == value) return
      field?.let { GlassSources.unregister(it, this) }
      field = value
      if (isAttachedToWindow) value?.let { GlassSources.register(it, this) }
    }

  /** This source's children, by reference; null before API 29. */
  internal val captureNode: RenderNode? =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) RenderNode("GlassBackdropSource") else null

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    sourceName?.let { GlassSources.register(it, this) }
  }

  override fun onDetachedFromWindow() {
    sourceName?.let { GlassSources.unregister(it, this) }
    super.onDetachedFromWindow()
  }

  // React Native lays the children out (ExpoView is a LinearLayout, see AndroidGlassView).
  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) = Unit

  override fun dispatchDraw(canvas: Canvas) {
    super.dispatchDraw(canvas)
    val node = captureNode ?: return
    if (!canvas.isHardwareAccelerated || width == 0 || height == 0) return
    node.setPosition(0, 0, width, height)
    val recording = node.beginRecording()
    try {
      background?.draw(recording)
      val time = drawingTime
      for (i in 0 until childCount) {
        val child = getChildAt(i)
        if (child.visibility == VISIBLE) drawChild(recording, child, time)
      }
    } finally {
      node.endRecording()
    }
    // Keep the capture referenced from this view's own display list, drawn under an empty clip
    // (nothing shows). The renderer frees the content of a node that no display list references
    // anymore; without this, a capture used only now and then (a thumb's lens while pressed) is
    // empty the next time it is drawn, because this view does not re-record it until it redraws.
    val save = canvas.save()
    canvas.clipRect(0f, 0f, 0f, 0f)
    canvas.drawRenderNode(node)
    canvas.restoreToCount(save)
    sourceName?.let { GlassSources.sourceRedrawn(it) }
  }
}

/** Named sources and who draws them (main thread only). */
internal object GlassSources {
  private val sources = HashMap<String, WeakReference<GlassBackdropSource>>()
  // Watchers unregister on detach, so plain references are fine here.
  private val watchers = HashMap<Any, Pair<String, () -> Unit>>()

  fun find(name: String?): GlassBackdropSource? = name?.let { sources[it]?.get() }

  fun register(name: String, source: GlassBackdropSource) {
    sources[name] = WeakReference(source)
    sourceRedrawn(name)
  }

  fun unregister(name: String, source: GlassBackdropSource) {
    if (sources[name]?.get() === source) sources.remove(name)
    sourceRedrawn(name)
  }

  /** [key] draws [name] from now on and hears about it through [onChanged] (null: stop). */
  fun watch(key: Any, name: String?, onChanged: () -> Unit) {
    if (name == null) watchers.remove(key) else watchers[key] = name to onChanged
  }

  fun sourceRedrawn(name: String) {
    for ((watched, callback) in watchers.values.toList()) {
      if (watched == name) callback()
    }
  }
}

/**
 * Draws a named [GlassBackdropSource] behind [view] on the capture path: the part of the source
 * that is on screen under the view, in the view's own coordinates, with the view's transform
 * undone (a swelling or leaning view keeps its backdrop still). Calls [onChanged] when the source
 * redraws or appears, and invalidates the view when it moved against the source without redrawing
 * (e.g. a transform animated by React Native's native driver).
 */
internal class SourceBackdrop(
  private val view: View,
  /** Whether the view draws the source right now (a thumb only does while pressed). */
  private val inUse: () -> Boolean = { true },
  private val onChanged: () -> Unit,
) {

  var name: String? = null
    set(value) {
      field = value
      if (view.isAttachedToWindow) GlassSources.watch(this, value, onChanged)
      onChanged()
    }

  private val inverse = Matrix()
  private val location = IntArray(2)
  private var lastX = Int.MIN_VALUE
  private var lastY = Int.MIN_VALUE
  private val lastMatrix = FloatArray(9)
  private val matrixValues = FloatArray(9)

  private val preDrawListener = ViewTreeObserver.OnPreDrawListener {
    if (inUse() && source != null && moved()) view.invalidate()
    true
  }

  fun attach() {
    GlassSources.watch(this, name, onChanged)
    view.viewTreeObserver.addOnPreDrawListener(preDrawListener)
  }

  fun detach() {
    GlassSources.watch(this, null, onChanged)
    view.viewTreeObserver.removeOnPreDrawListener(preDrawListener)
  }

  /** The named source, unless it is missing or contains the view (it would draw itself). */
  val source: GlassBackdropSource?
    get() {
      val found = GlassSources.find(name) ?: return null
      var p = view.parent
      while (p is View) {
        if (p === found) return null
        p = p.parent
      }
      return found
    }

  /** The capture path applies: no platform backdrop, RenderEffect available, a usable source. */
  val isActive: Boolean
    get() = !BackdropApi.isSupported && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && source != null

  /** Where the view's layout box is in the source (the view's own transform excluded). */
  private fun offset(source: View): Pair<Int, Int> {
    val p = view.parent as? View ?: return 0 to 0
    p.getLocationInWindow(location)
    val x = location[0] + view.left - p.scrollX
    val y = location[1] + view.top - p.scrollY
    source.getLocationInWindow(location)
    return (x - location[0]) to (y - location[1])
  }

  private fun moved(): Boolean {
    val src = source ?: return false
    val (x, y) = offset(src)
    view.matrix.getValues(matrixValues)
    if (x == lastX && y == lastY && matrixValues.contentEquals(lastMatrix)) return false
    // Remember it now: a view that skips drawing the source this frame would otherwise look
    // moved on every frame and redraw forever.
    lastX = x
    lastY = y
    matrixValues.copyInto(lastMatrix)
    return true
  }

  /** Draws the source into [canvas] (a recording canvas), view-local. False when there is none. */
  fun draw(canvas: Canvas): Boolean {
    val src = source ?: return false
    val captured = src.captureNode ?: return false
    val (x, y) = offset(src)
    lastX = x
    lastY = y
    view.matrix.getValues(lastMatrix)
    val save = canvas.save()
    // The canvas this lands on is transformed by the view's matrix; undo it.
    if (view.matrix.invert(inverse)) canvas.concat(inverse)
    canvas.translate(-x.toFloat(), -y.toFloat())
    canvas.drawRenderNode(captured)
    canvas.restoreToCount(save)
    return true
  }
}
