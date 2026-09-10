/*
 * Adapted from BackdropCapture.kt in QWEA0/Liquid-Glass-Android
 * (https://github.com/QWEA0/Liquid-Glass-Android), Copyright (c) 2025-2026 pandadog,
 * released under the MIT License. See THIRD_PARTY_NOTICES.md.
 *
 * Changes from upstream: renamed, comments translated, generalised from "skip the one glass
 * that is sampling" to "skip every other glass view", glass ancestors of the sampling view are
 * drawn instead of skipped, and expanded branches are positioned with the framework's own child
 * transform (left/top, scroll, matrix, alpha) instead of screen deltas.
 */
package expo.modules.androidglassview.capture

import android.graphics.Canvas
import android.os.Build
import android.view.View
import android.view.ViewGroup
import androidx.annotation.RequiresApi

/**
 * Draws a source view's content into a canvas while leaving glass views out of it.
 *
 * A plain `source.draw(canvas)` is only safe when no glass view lives under `source`:
 *
 * 1. **Re-entrant recording.** A glass view samples while it is being drawn, so the RenderNodes
 *    of its ancestors can be in the middle of `beginRecording`. Drawing one of them again through
 *    `drawChild` → `updateDisplayListIfDirty` throws
 *    `IllegalStateException: Recording currently in progress`.
 * 2. **Reference cycles.** `drawChild` records a *reference* to a child's RenderNode, not pixels.
 *    If that subtree contains the sampling glass, the glass would draw itself (glass → backdrop →
 *    ancestor → glass), which recurses forever on the RenderThread. The same happens between two
 *    glass views that sample each other.
 *
 * So every container that has a skipped glass view somewhere below it (an *expanded* container)
 * is drawn with the public [View.draw], which neither touches its RenderNode nor records a
 * reference to it. For that call, its children that are skipped glass views or contain one are
 * hidden (so `dispatchDraw` skips them); the ones that only contain glass are then drawn one level
 * deeper with the same rule. Every other child keeps going through the normal fast path (a
 * RenderNode reference). That is safe: nothing inside those subtrees is ever hidden, so a display
 * list that happens to be re-recorded here is exactly what the regular frame would record, and it
 * cannot reference a skipped glass view. It also keeps the backdrop live for free — when such a
 * child re-records its display list or animates its RenderNode properties, the backdrop sees it.
 *
 * Glass views that are *ancestors* of the sampling one are not skipped: glass on top of a glass
 * card sees the card. That cannot form a cycle, because an ancestor never samples its own subtree.
 *
 * Known trade-offs (same as upstream): inside an expanded container, glass-containing branches
 * are drawn after their siblings, so a sibling that normally paints above such a branch ends up
 * below it in the backdrop; elevation shadows of expanded branches are not drawn.
 */
@RequiresApi(Build.VERSION_CODES.Q) // View.setTransitionVisibility
internal class ViewBackdropCapture {

  /** Containers that have at least one skipped glass view somewhere below them. */
  private val expanded = HashSet<View>()

  /** Glass views that are never drawn into this backdrop. */
  private val excluded = HashSet<View>()

  /** Ancestors of the sampling glass view, up to the source. */
  private val selfPath = HashSet<View>()

  private val path = ArrayList<View>()

  /** Children hidden for the current `View.draw` calls, stacked per level. */
  private val hidden = ArrayList<View>()

  /**
   * @param canvas a hardware canvas whose origin is aligned with [source]'s top-left corner.
   * @param self the glass view that is sampling.
   * @param glassViews every glass view; the ones outside [source] are ignored.
   */
  fun draw(canvas: Canvas, source: View, self: View, glassViews: Collection<View>) {
    expanded.clear()
    excluded.clear()
    selfPath.clear()

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
    val group = if (host in expanded) host as? ViewGroup else null
    val firstHidden = hidden.size
    if (group != null) {
      for (i in 0 until group.childCount) {
        val child = group.getChildAt(i)
        if (child.visibility == View.VISIBLE && (child in excluded || child in expanded)) {
          // Only flips the visibility flag; does not invalidate anything.
          child.setTransitionVisibility(View.INVISIBLE)
          hidden.add(child)
        }
      }
    }
    val lastHidden = hidden.size

    val save = canvas.save()
    try {
      // The public View.draw() does not apply the view's own scroll offset (the framework does
      // that in updateDisplayListIfDirty), so apply it here.
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
        if (child in excluded) continue
        val childSave = canvas.save()
        // Same transform the parent applies when it draws the child normally.
        canvas.translate((child.left - host.scrollX).toFloat(), (child.top - host.scrollY).toFloat())
        val matrix = child.matrix
        if (!matrix.isIdentity) canvas.concat(matrix)
        if (clipChildren) canvas.clipRect(0f, 0f, child.width.toFloat(), child.height.toFloat())
        val alpha = child.alpha
        if (alpha < 1f) {
          canvas.saveLayerAlpha(0f, 0f, child.width.toFloat(), child.height.toFloat(), (alpha * 255f).toInt())
        }
        drawLevel(canvas, child)
        canvas.restoreToCount(childSave)
      }
    }

    while (hidden.size > firstHidden) {
      hidden.removeAt(hidden.size - 1)
    }
  }

  companion object {
    private var depth = 0

    /** True while any glass view is sampling (main thread only). */
    val isCapturing: Boolean
      get() = depth > 0
  }
}
