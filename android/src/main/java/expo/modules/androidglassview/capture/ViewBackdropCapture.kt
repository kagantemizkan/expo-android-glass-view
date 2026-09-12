/*
 * Adapted from BackdropCapture.kt in QWEA0/Liquid-Glass-Android
 * (https://github.com/QWEA0/Liquid-Glass-Android), Copyright (c) 2025-2026 pandadog,
 * released under the MIT License. See THIRD_PARTY_NOTICES.md.
 *
 * Changes from upstream: renamed, comments translated, generalised from "skip the one glass
 * that is sampling" to "skip every other glass view", glass ancestors of the sampling view are
 * drawn instead of skipped, expanded branches are positioned with the framework's own child
 * transform (left/top, scroll, matrix, alpha) instead of screen deltas, the ancestors of the
 * sampling view are drawn child by child instead of through their own draw(), and children that
 * cannot reach the recorded area are left out (culled).
 */
package expo.modules.androidglassview.capture

import android.graphics.Canvas
import android.graphics.RectF
import android.os.Build
import android.view.View
import android.view.ViewGroup
import android.view.animation.Animation
import androidx.annotation.RequiresApi
import kotlin.math.max

/**
 * Draws a source view's content into a canvas while leaving glass views out of it.
 *
 * A plain `source.draw(canvas)` is only safe when no glass view lives under `source`:
 *
 * 1. **Re-entrant drawing.** A glass view samples while it is being drawn, so its ancestors are in
 *    the middle of their own draw: their RenderNodes are recording and their `dispatchDraw` is
 *    mid-loop. Drawing one of them again re-enters both. The child on the way to the glass goes
 *    back through `drawChild` → `updateDisplayListIfDirty` and throws
 *    `IllegalStateException: Recording currently in progress` — hiding it doesn't help, a view
 *    with a running view Animation (react-native-screens' screen transitions) is drawn even when
 *    invisible. Per-view drawing state breaks as well: ViewGroup reuses one pre-sorted child list
 *    (children with elevation) that the inner call clears under the outer loop.
 * 2. **Reference cycles.** `drawChild` records a *reference* to a child's RenderNode, not pixels.
 *    If that subtree contains the sampling glass, the glass would draw itself (glass → backdrop →
 *    ancestor → glass), which recurses forever on the RenderThread. The same happens between two
 *    glass views that sample each other.
 *
 * So the ancestors of the sampling glass are never drawn through their own `draw()`: their
 * background and children are drawn here, in their drawing order ([drawAncestor]) — other glass
 * views left out, containers of glass one level deeper, every other child with its public
 * [View.draw] (its own content is copied, its subtree still goes through RenderNode references).
 *
 * Every other container that has a skipped glass view somewhere below it (an *expanded*
 * container) is not being drawn right now, so it is drawn with the public [View.draw], which
 * neither touches its RenderNode nor records a reference to it. For that call, its children that
 * are skipped glass views or contain one are hidden (so `dispatchDraw` skips them); the ones that
 * only contain glass are then drawn one level deeper with the same rule. Every other child keeps
 * going through the normal fast path (a RenderNode reference). That is safe: nothing inside those
 * subtrees is ever hidden, so a display list that happens to be re-recorded here is exactly what
 * the regular frame would record, and it cannot reference a skipped glass view. It also keeps the
 * backdrop live for free — when such a child re-records its display list or animates its
 * RenderNode properties, the backdrop sees it.
 *
 * Glass views that are *ancestors* of the sampling one are not skipped: glass on top of a glass
 * card sees the card. That cannot form a cycle, because an ancestor never samples its own subtree.
 *
 * **Culling.** The capture only covers the area around the glass, but a reference to a subtree
 * anywhere on screen makes the RenderThread re-render this glass — capture, blur and refraction —
 * whenever that subtree changes, even when none of it can be seen through the glass. With a few
 * glass views on a screen with an animation, that is every glass view on every frame. So a child
 * is left out when nothing it draws can reach the recorded area ([reachesRecordedArea]): neither
 * its bounds (plus a margin for shadows) nor, as long as it doesn't clip them, those of its
 * descendants. A left-out child is not referenced, so it is not live: [changedSinceCapture]
 * reports when one of them moved, resized or scrolled, and the glass then captures again.
 *
 * Known trade-offs: the children of ancestors are drawn without their view Animation and
 * elevation shadow; inside an expanded container that is not an ancestor, glass-containing
 * branches are drawn after their siblings, so a sibling that normally paints above such a branch
 * ends up below it in the backdrop; content drawn well outside its view's bounds (farther than
 * the cull margin, e.g. a large box shadow) is missing from glass views that its view is away
 * from, and so is content a left-out subtree animates into the glass area without its own root
 * moving.
 */
@RequiresApi(Build.VERSION_CODES.Q) // View.setTransitionVisibility, ViewGroup.getChildDrawingOrder(int)
internal class ViewBackdropCapture {

  /** Containers that have at least one skipped glass view somewhere below them. */
  private val expanded = HashSet<View>()

  /** Glass views that are never drawn into this backdrop. */
  private val excluded = HashSet<View>()

  /** Ancestors of the sampling glass view, up to the source. They are being drawn right now. */
  private val selfPath = HashSet<View>()

  private val path = ArrayList<View>()

  /** Children hidden for the current `View.draw` calls, stacked per level. */
  private val hidden = ArrayList<View>()

  /**
   * Views whose scroll offset the last capture applied itself, with the offsets it used (x, y
   * pairs in [bakedScroll]). Every other scrolling view is referenced through its RenderNode, so
   * the capture follows it without being recorded again.
   */
  private val bakedViews = ArrayList<View>()
  private var bakedScroll = IntArray(32)

  /**
   * Child lists dispatched inline, rather than through the group's own RenderNode. A screen
   * replacement can discard a referenced child's display list without moving any views.
   */
  private val inlineGroups = ArrayList<InlineGroup>()

  /** Culled children, and children whose transform/clip/alpha we applied ourselves. */
  private val geometryViews = ArrayList<View>()
  private var geometry = FloatArray(GEOMETRY_FIELDS * 16)
  private var geometryTracksAlpha = BooleanArray(16)
  private val culledSet = HashSet<View>()

  /** Margin around a view's bounds that its drawing may still reach (shadows, borders), in px. */
  private var cullPadding = 0f
  private val cullRect = RectF()

  /**
   * Whether the last capture is out of date although the glass itself didn't move: a view whose
   * scroll offset or transform it baked in changed, an inline group changed its children, or a
   * view it left out moved (and may now reach the glass). RenderNode subtrees stay live without
   * being traversed here. This check allocates nothing.
   */
  fun changedSinceCapture(): Boolean {
    for (i in bakedViews.indices) {
      val view = bakedViews[i]
      if (view.scrollX != bakedScroll[i * 2] || view.scrollY != bakedScroll[i * 2 + 1]) return true
    }
    for (i in geometryViews.indices) {
      if (!hasGeometry(geometryViews[i], i)) return true
    }
    for (i in inlineGroups.indices) {
      if (inlineGroups[i].hasChanged()) return true
    }
    return false
  }

  /** Forgets the views of the last capture (they may belong to a window that is going away). */
  fun clear() {
    expanded.clear()
    excluded.clear()
    selfPath.clear()
    path.clear()
    hidden.clear()
    bakedViews.clear()
    inlineGroups.clear()
    geometryViews.clear()
    culledSet.clear()
  }

  private fun bakeScroll(view: View) {
    val index = bakedViews.size
    if (bakedScroll.size < (index + 1) * 2) bakedScroll = bakedScroll.copyOf(bakedScroll.size * 2)
    bakedViews.add(view)
    bakedScroll[index * 2] = view.scrollX
    bakedScroll[index * 2 + 1] = view.scrollY
  }

  private fun cull(view: View) {
    culledSet.add(view)
    // A fade outside the capture cannot bring any content into it.
    bakeGeometry(view, trackAlpha = false)
  }

  private fun bakeGeometry(view: View, trackAlpha: Boolean = true) {
    val index = geometryViews.size
    val offset = index * GEOMETRY_FIELDS
    if (geometry.size < offset + GEOMETRY_FIELDS) {
      geometry = geometry.copyOf(geometry.size * 2)
      geometryTracksAlpha = geometryTracksAlpha.copyOf(geometryTracksAlpha.size * 2)
    }
    geometryTracksAlpha[index] = trackAlpha
    geometryViews.add(view)
    val g = geometry
    g[offset] = view.left.toFloat()
    g[offset + 1] = view.top.toFloat()
    g[offset + 2] = view.right.toFloat()
    g[offset + 3] = view.bottom.toFloat()
    g[offset + 4] = view.translationX
    g[offset + 5] = view.translationY
    g[offset + 6] = view.scaleX
    g[offset + 7] = view.scaleY
    g[offset + 8] = view.rotation
    g[offset + 9] = view.rotationX
    g[offset + 10] = view.rotationY
    g[offset + 11] = view.scrollX.toFloat()
    g[offset + 12] = view.scrollY.toFloat()
    g[offset + 13] = view.z
    g[offset + 14] = view.pivotX
    g[offset + 15] = view.pivotY
    g[offset + 16] = view.alpha
    g[offset + 17] = view.cameraDistance
  }

  private fun hasGeometry(view: View, index: Int): Boolean {
    val offset = index * GEOMETRY_FIELDS
    val g = geometry
    return g[offset] == view.left.toFloat() &&
      g[offset + 1] == view.top.toFloat() &&
      g[offset + 2] == view.right.toFloat() &&
      g[offset + 3] == view.bottom.toFloat() &&
      g[offset + 4] == view.translationX &&
      g[offset + 5] == view.translationY &&
      g[offset + 6] == view.scaleX &&
      g[offset + 7] == view.scaleY &&
      g[offset + 8] == view.rotation &&
      g[offset + 9] == view.rotationX &&
      g[offset + 10] == view.rotationY &&
      g[offset + 11] == view.scrollX.toFloat() &&
      g[offset + 12] == view.scrollY.toFloat() &&
      g[offset + 13] == view.z &&
      g[offset + 14] == view.pivotX &&
      g[offset + 15] == view.pivotY &&
      (!geometryTracksAlpha[index] || g[offset + 16] == view.alpha) &&
      g[offset + 17] == view.cameraDistance
  }

  /**
   * @param canvas a hardware canvas whose origin is aligned with [source]'s top-left corner, and
   *   whose clip is the area to record (children that cannot reach it are left out).
   * @param self the glass view that is sampling.
   * @param glassViews every glass view; the ones outside [source] are ignored.
   */
  fun draw(canvas: Canvas, source: View, self: View, glassViews: Collection<View>) {
    clear()
    cullPadding = CULL_PADDING_DP * source.resources.displayMetrics.density

    var ancestor = self.parent
    while (ancestor is View) {
      selfPath.add(ancestor)
      if (ancestor === source) break
      ancestor = ancestor.parent
    }

    for (glass in glassViews) {
      if (glass === source || glass in selfPath) continue
      path.clear()
      var parent = glass.parent
      var reachedSource = false
      while (parent is View) {
        path.add(parent)
        if (parent === source) {
          reachedSource = true
          break
        }
        parent = parent.parent
      }
      if (reachedSource) {
        excluded.add(glass)
        expanded.addAll(path)
      }
    }
    path.clear()

    depth++
    val save = canvas.save()
    try {
      canvas.clipRect(0f, 0f, source.width.toFloat(), source.height.toFloat())
      drawLevel(canvas, source)
    } finally {
      canvas.restoreToCount(save)
      hidden.clear()
      depth--
    }
  }

  private fun drawLevel(canvas: Canvas, host: View) {
    // Snapshot before temporarily hiding children; otherwise every pre-draw sees a change.
    if (host is ViewGroup) inlineGroups.add(InlineGroup(host))
    if (host is ViewGroup && host in selfPath) {
      drawAncestor(canvas, host)
      return
    }

    val group = if (host in expanded) host as? ViewGroup else null
    val firstHidden = hidden.size
    if (group != null) {
      for (i in 0 until group.childCount) {
        val child = group.getChildAt(i)
        if (child.visibility != View.VISIBLE) continue
        val outside = child !in excluded && child.animation == null &&
          !reachesRecordedArea(canvas, child, (child.left - host.scrollX).toFloat(), (child.top - host.scrollY).toFloat())
        if (child in excluded || child in expanded || outside) {
          // Only flips the visibility flag; does not invalidate anything.
          child.setTransitionVisibility(View.INVISIBLE)
          hidden.add(child)
          if (outside) cull(child)
        }
      }
    }
    val lastHidden = hidden.size

    val save = canvas.save()
    try {
      // The public View.draw() does not apply the view's own scroll offset (the framework does
      // that in updateDisplayListIfDirty), so apply it here.
      bakeScroll(host)
      canvas.translate(-host.scrollX.toFloat(), -host.scrollY.toFloat())
      host.draw(canvas)
    } finally {
      canvas.restoreToCount(save)
      for (i in firstHidden until lastHidden) {
        hidden[i].setTransitionVisibility(View.VISIBLE)
      }
    }

    if (group != null) {
      val clipChildren = group.clipChildren
      for (i in firstHidden until lastHidden) {
        val child = hidden[i]
        if (child in excluded || child in culledSet) continue
        val childSave = canvas.save()
        // Same transform the parent applies when it draws the child normally.
        canvas.translate((child.left - host.scrollX).toFloat(), (child.top - host.scrollY).toFloat())
        applyChildTransform(canvas, child, clipChildren)
        drawLevel(canvas, child)
        canvas.restoreToCount(childSave)
      }
    }

    while (hidden.size > firstHidden) {
      hidden.removeAt(hidden.size - 1)
    }
  }

  /**
   * Draws an ancestor of the sampling glass view without calling its draw() (see the class
   * comment): its background, then its children in drawing order.
   */
  private fun drawAncestor(canvas: Canvas, host: ViewGroup) {
    val save = canvas.save()
    try {
      // View.draw() paints the background at the view's origin, whatever its scroll offset.
      host.background?.draw(canvas)
      bakeScroll(host)
      canvas.translate(-host.scrollX.toFloat(), -host.scrollY.toFloat())
      val clipChildren = host.clipChildren
      for (child in childrenInDrawingOrder(host)) {
        if (child in excluded) continue
        // Same visibility rule as ViewGroup.dispatchDraw.
        if (child.visibility != View.VISIBLE && child.animation == null) continue
        if (child.animation == null && !reachesRecordedArea(canvas, child, child.left.toFloat(), child.top.toFloat())) {
          cull(child)
          continue
        }
        val childSave = canvas.save()
        canvas.translate(child.left.toFloat(), child.top.toFloat())
        applyChildTransform(canvas, child, clipChildren)
        if (child in expanded) {
          drawLevel(canvas, child)
        } else {
          if (child is ViewGroup) inlineGroups.add(InlineGroup(child))
          bakeScroll(child)
          canvas.translate(-child.scrollX.toFloat(), -child.scrollY.toFloat())
          child.draw(canvas)
        }
        canvas.restoreToCount(childSave)
      }
    } finally {
      canvas.restoreToCount(save)
    }
  }

  /**
   * Whether anything [view] draws can land in the area being recorded (the canvas clip). [x], [y]
   * is the view's position in the current canvas coordinates. A view that doesn't clip its
   * children lets them draw outside its bounds, so they are checked too, recursively.
   */
  private fun reachesRecordedArea(canvas: Canvas, view: View, x: Float, y: Float): Boolean {
    val save = canvas.save()
    try {
      canvas.translate(x, y)
      val matrix = view.matrix
      if (!matrix.isIdentity) canvas.concat(matrix)
      val padding = cullPadding + max(view.z, 0f) * 2f
      cullRect.set(-padding, -padding, view.width + padding, view.height + padding)
      @Suppress("DEPRECATION") // quickReject(RectF) needs API 30
      if (!canvas.quickReject(cullRect, Canvas.EdgeType.BW)) return true
      if (view is ViewGroup && !view.clipChildren) {
        for (i in 0 until view.childCount) {
          val child = view.getChildAt(i)
          if (child.visibility != View.VISIBLE && child.animation == null) continue
          if (child.animation != null) return true
          val childX = (child.left - view.scrollX).toFloat()
          val childY = (child.top - view.scrollY).toFloat()
          if (reachesRecordedArea(canvas, child, childX, childY)) return true
        }
      }
      return false
    } finally {
      canvas.restoreToCount(save)
    }
  }

  /** The child's matrix, clip and alpha, as its parent applies them; the canvas is at its left/top. */
  private fun applyChildTransform(canvas: Canvas, child: View, clipChildren: Boolean) {
    bakeGeometry(child)
    val matrix = child.matrix
    if (!matrix.isIdentity) canvas.concat(matrix)
    if (clipChildren) canvas.clipRect(0f, 0f, child.width.toFloat(), child.height.toFloat())
    val alpha = child.alpha
    if (alpha < 1f) {
      canvas.saveLayerAlpha(0f, 0f, child.width.toFloat(), child.height.toFloat(), (alpha * 255f).toInt())
    }
  }

  /**
   * The children in the order their parent draws them, like ViewGroup.buildOrderedChildList: the
   * custom drawing order (React Native's zIndex), then elevation, stable.
   */
  private fun childrenInDrawingOrder(group: ViewGroup): List<View> {
    val count = group.childCount
    val children = ArrayList<View>(count)
    for (i in 0 until count) {
      val index = group.getChildDrawingOrder(i)
      children.add(group.getChildAt(if (index in 0 until count) index else i))
    }
    children.sortBy { it.z }
    return children
  }

  /** Only the direct dispatch boundary is frozen; descendants keep their live RenderNodes. */
  private class InlineGroup(private val group: ViewGroup) {
    private val count = group.childCount
    private val children = Array(count) { group.getChildAt(it) }
    private val visibility = IntArray(count) { children[it].visibility }
    private val order = IntArray(count) { group.getChildDrawingOrder(it) }
    private val z = FloatArray(count) { children[it].z }
    private val animations = arrayOfNulls<Animation>(count).also { values ->
      for (i in 0 until count) values[i] = children[i].animation
    }
    private val clipChildren = group.clipChildren
    private val clipToPadding = group.clipToPadding

    fun hasChanged(): Boolean {
      if (group.childCount != count || group.clipChildren != clipChildren ||
        group.clipToPadding != clipToPadding) return true
      for (i in 0 until count) {
        val child = group.getChildAt(i)
        if (child !== children[i] || child.visibility != visibility[i] ||
          group.getChildDrawingOrder(i) != order[i] || child.z != z[i] ||
          child.animation !== animations[i]) return true
      }
      return false
    }
  }

  companion object {
    private var depth = 0

    /** Geometry values stored per culled or manually transformed view. */
    private const val GEOMETRY_FIELDS = 18

    /** How far outside its bounds a view's drawing is assumed to reach (shadows, borders). */
    private const val CULL_PADDING_DP = 8f

    /** True while any glass view is sampling (main thread only). */
    val isCapturing: Boolean
      get() = depth > 0
  }
}
