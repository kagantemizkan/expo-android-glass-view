package expo.modules.androidglassview

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.PorterDuffColorFilter
import android.graphics.Rect
import android.view.MotionEvent
import android.view.View
import android.view.ViewConfiguration
import android.view.ViewTreeObserver
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.ComposeView
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.findViewTreeLifecycleOwner
import androidx.lifecycle.setViewTreeLifecycleOwner
import androidx.savedstate.SavedStateRegistryOwner
import androidx.savedstate.findViewTreeSavedStateRegistryOwner
import androidx.savedstate.setViewTreeSavedStateRegistryOwner
import com.facebook.react.uimanager.events.NativeGestureUtil
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView
import kotlin.math.abs

/**
 * Base class of every glass view: a React Native view whose first child is a [ComposeView]
 * rendering Kyant's liquid glass, with the React Native screen behind it as the backdrop.
 *
 * React children come after the Compose layer. React Native positions them itself, so this view
 * only ever lays out the Compose layer.
 */
@SuppressLint("ViewConstructor")
abstract class GlassHostView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {

  /** Samples the window behind this view. One instance can serve every glass node of the view. */
  internal val backdrop = ViewBackdrop(this)

  /** The view the glass samples: the root of the window it is attached to. */
  internal val backdropSource: View?
    get() = if (isAttachedToWindow) rootView else null

  /**
   * When true, React children are not drawn by the view system. The Compose content draws them
   * instead (see [drawReactChildren]), so they live *inside* the glass: clipped to its shape and
   * transformed together with it (press / drag feedback).
   */
  protected open val drawsReactChildrenInCompose: Boolean = false

  /** When true, a horizontal drag that starts on this view is claimed from scrolling parents. */
  protected open val claimsHorizontalDrags: Boolean = false

  /** Bumped whenever the React children may look different; read it while drawing them. */
  internal var reactChildrenGeneration by mutableIntStateOf(0)
    private set

  // Not named `Content`: inside `apply`, that would resolve to ComposeView.Content(), which
  // invokes this very lambda again (infinite recursion).
  private val composeView = ComposeView(context).apply {
    setContent { GlassContent() }
  }

  private val lastLocation = intArrayOf(Int.MIN_VALUE, Int.MIN_VALUE)
  private val location = IntArray(2)
  private val visibleRect = Rect()
  private var observer: ViewTreeObserver? = null
  private var layoutPending = false
  private var resamplePending = false

  private val touchSlop = ViewConfiguration.get(context).scaledTouchSlop
  private var downX = 0f
  private var downY = 0f
  private var dragClaimed = false

  // Re-sample when the glass moves on screen (layout, an ancestor scrolling, transforms).
  private val preDrawListener = ViewTreeObserver.OnPreDrawListener {
    getLocationOnScreen(location)
    if (location[0] != lastLocation[0] || location[1] != lastLocation[1]) {
      lastLocation[0] = location[0]
      lastLocation[1] = location[1]
      resampleIfVisible()
    } else if (resamplePending) {
      resampleIfVisible()
    }
    true
  }

  // Scrolling changes the containers that are drawn inline into the backdrop (the ones between
  // the window root and a glass view), so re-sample. There is deliberately no global-layout
  // listener: React Native lays out on every state change (e.g. each slider tick updating a
  // label), and re-sampling every glass view each time made interactions stutter. Everything
  // else behind the glass is referenced live (see ViewBackdropCapture).
  private val scrollListener = ViewTreeObserver.OnScrollChangedListener { resampleIfVisible() }

  /**
   * Re-samples now if any part of this view is on screen. Sampling costs a capture plus the
   * glass effects on the GPU, so glass scrolled out of view waits until it is visible again.
   */
  private fun resampleIfVisible() {
    if (isShown && getGlobalVisibleRect(visibleRect)) {
      resamplePending = false
      backdrop.invalidate()
    } else {
      resamplePending = true
    }
  }

  init {
    clipChildren = false
    clipToPadding = false
    composeView.clipChildren = false
    super.addView(composeView, 0, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
    // The Compose layer is not sized while it is detached (see onMeasure); size it on attach.
    // Listeners run after the view's own onAttachedToWindow, so it is attached by then.
    composeView.addOnAttachStateChangeListener(object : View.OnAttachStateChangeListener {
      override fun onViewAttachedToWindow(v: View) = layoutComposeLayer()
      override fun onViewDetachedFromWindow(v: View) = Unit
    })
  }

  @Composable
  protected abstract fun GlassContent()

  internal fun invalidateBackdrop() {
    backdrop.invalidate()
  }

  // region React children (offset by the Compose layer at index 0)

  internal val reactChildCount: Int
    get() = childCount - 1

  internal fun getReactChildAt(index: Int): View? = getChildAt(index + 1)

  internal fun addReactChild(child: View, index: Int) {
    addView(child, index + 1)
  }

  internal fun removeReactChildAt(index: Int) {
    removeViewAt(index + 1)
  }

  internal fun removeReactChild(child: View) {
    removeView(child)
  }

  override fun onViewAdded(child: View?) {
    super.onViewAdded(child)
    if (child !== composeView) reactChildrenGeneration++
  }

  override fun onViewRemoved(child: View?) {
    super.onViewRemoved(child)
    if (child !== composeView) reactChildrenGeneration++
  }

  /**
   * Draws the React children into [canvas], positioned like the view system would draw them.
   * [scale] additionally scales each child around its own centre.
   */
  internal fun drawReactChildrenInto(canvas: Canvas, scale: Float) {
    for (i in 1 until childCount) {
      val child = getChildAt(i)
      if (child.visibility != View.VISIBLE) continue
      val width = child.width.toFloat()
      val height = child.height.toFloat()
      val save = canvas.save()
      canvas.translate((child.left - scrollX).toFloat(), (child.top - scrollY).toFloat())
      val matrix = child.matrix
      if (!matrix.isIdentity) canvas.concat(matrix)
      if (scale != 1f) canvas.scale(scale, scale, width / 2f, height / 2f)
      val alpha = child.alpha
      if (alpha < 1f) canvas.saveLayerAlpha(0f, 0f, width, height, (alpha * 255f).toInt())
      child.draw(canvas)
      canvas.restoreToCount(save)
    }
  }

  override fun drawChild(canvas: Canvas, child: View, drawingTime: Long): Boolean {
    if (drawsReactChildrenInCompose && child !== composeView) return false
    return super.drawChild(canvas, child, drawingTime)
  }

  override fun onDescendantInvalidated(child: View, target: View) {
    super.onDescendantInvalidated(child, target)
    // React children drawn by Compose are not redrawn by the view system; tell Compose instead.
    if (drawsReactChildrenInCompose && child !== composeView) reactChildrenGeneration++
  }

  // endregion

  // region Layout

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val width = MeasureSpec.getSize(widthMeasureSpec)
    val height = MeasureSpec.getSize(heightMeasureSpec)
    setMeasuredDimension(width, height)
    // ComposeView creates its composition on its first measure, and that needs the window's
    // recomposer: measured off-window it throws "Cannot locate windowRecomposer". Fabric does
    // measure off-window views — a screen react-native-screens has not attached yet (a pushed
    // screen, a tab opened for the first time) or has detached — so skip the Compose layer until
    // it is attached. The attach listener in init sizes it then.
    if (!composeView.isAttachedToWindow) return
    composeView.measure(
      MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
    )
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    // React Native lays out the React children; only the glass layer is ours.
    if (!composeView.isAttachedToWindow) return
    composeView.layout(0, 0, right - left, bottom - top)
  }

  /** Sizes the Compose layer to this view outside a layout pass (see [onMeasure]). */
  private fun layoutComposeLayer() {
    composeView.measure(
      MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
    )
    composeView.layout(0, 0, width, height)
  }

  override fun requestLayout() {
    super.requestLayout()
    // React Native does not run Android layout passes, so honour the Compose layer's
    // layout requests ourselves.
    if (isAttachedToWindow && !layoutPending) {
      layoutPending = true
      post {
        layoutPending = false
        measureAndLayout()
      }
    }
  }

  // endregion

  // region Touch

  override fun dispatchTouchEvent(event: MotionEvent): Boolean {
    if (claimsHorizontalDrags) trackHorizontalDrag(event)
    return super.dispatchTouchEvent(event)
  }

  /**
   * Once a drag on this view turns out to be horizontal, stop scrolling parents from stealing it
   * and tell React Native's JS responder system that a native gesture took over.
   */
  private fun trackHorizontalDrag(event: MotionEvent) {
    when (event.actionMasked) {
      MotionEvent.ACTION_DOWN -> {
        downX = event.x
        downY = event.y
        dragClaimed = false
      }
      MotionEvent.ACTION_MOVE -> if (!dragClaimed) {
        val dx = abs(event.x - downX)
        val dy = abs(event.y - downY)
        if (dx > touchSlop && dx > dy) {
          dragClaimed = true
          parent?.requestDisallowInterceptTouchEvent(true)
          NativeGestureUtil.notifyNativeGestureStarted(this, event)
        }
      }
      MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
        if (dragClaimed) NativeGestureUtil.notifyNativeGestureEnded(this, event)
        dragClaimed = false
      }
    }
  }

  // endregion

  // region Attach / detach

  override fun onAttachedToWindow() {
    ensureViewTreeOwners()
    super.onAttachedToWindow()
    observer = viewTreeObserver.also {
      it.addOnPreDrawListener(preDrawListener)
      it.addOnScrollChangedListener(scrollListener)
    }
    GlassRegistry.add(this)
  }

  override fun onDetachedFromWindow() {
    observer?.takeIf { it.isAlive }?.let {
      it.removeOnPreDrawListener(preDrawListener)
      it.removeOnScrollChangedListener(scrollListener)
    }
    observer = null
    lastLocation[0] = Int.MIN_VALUE
    lastLocation[1] = Int.MIN_VALUE
    GlassRegistry.remove(this)
    backdrop.release()
    super.onDetachedFromWindow()
  }

  /**
   * ComposeView needs a lifecycle and saved-state owner on the view tree. Activity windows have
   * them; a window without them (e.g. a plain Dialog used by React Native's Modal) would crash,
   * so fall back to the current activity.
   */
  private fun ensureViewTreeOwners() {
    val activity = appContext.currentActivity ?: return
    if (findViewTreeLifecycleOwner() == null && activity is LifecycleOwner) {
      setViewTreeLifecycleOwner(activity)
    }
    if (findViewTreeSavedStateRegistryOwner() == null && activity is SavedStateRegistryOwner) {
      setViewTreeSavedStateRegistryOwner(activity)
    }
  }

  // endregion
}

private val tintPaint = Paint()

/**
 * Draws [host]'s React children from inside a Compose draw scope.
 *
 * @param origin position of the current draw scope inside the host, so children land where
 *   React Native placed them.
 * @param tint when set, the children are drawn as a silhouette in this colour (SrcIn).
 * @param scale scales every child around its own centre.
 */
internal fun DrawScope.drawReactChildren(
  host: GlassHostView,
  origin: Offset = Offset.Zero,
  tint: Color? = null,
  scale: Float = 1f
) {
  // Reading the generation subscribes this draw to changes of the React children.
  if (host.reactChildrenGeneration < 0) return
  drawReactLayer(origin, tint) { canvas -> host.drawReactChildrenInto(canvas, scale) }
}

/**
 * Runs [draw] on the native canvas of a Compose draw scope, in the host's coordinates.
 *
 * @param origin position of the current draw scope inside the host.
 * @param tint when set, whatever [draw] draws becomes a silhouette in this colour (SrcIn).
 */
internal fun DrawScope.drawReactLayer(origin: Offset, tint: Color?, draw: (Canvas) -> Unit) {
  drawIntoCanvas { canvas ->
    val nativeCanvas = canvas.nativeCanvas
    val save = nativeCanvas.save()
    nativeCanvas.translate(-origin.x, -origin.y)
    if (tint != null) {
      tintPaint.colorFilter = PorterDuffColorFilter(tint.toArgb(), PorterDuff.Mode.SRC_IN)
      nativeCanvas.saveLayer(null, tintPaint)
    }
    draw(nativeCanvas)
    nativeCanvas.restoreToCount(save)
  }
}
