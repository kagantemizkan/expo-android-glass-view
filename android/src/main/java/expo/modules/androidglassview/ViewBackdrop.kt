package expo.modules.androidglassview

import android.graphics.RenderNode
import android.os.Build
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshots.Snapshot
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.GraphicsLayerScope
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.layout.LayoutCoordinates
import androidx.compose.ui.layout.positionInRoot
import androidx.compose.ui.unit.Density
import expo.modules.androidglassview.backdrop.Backdrop
import expo.modules.androidglassview.backdrop.internal.InverseLayerScope
import expo.modules.androidglassview.capture.ViewBackdropCapture
import kotlin.math.ceil

/**
 * A Kyant [Backdrop] whose content is the Android View tree behind a glass view — i.e. the
 * React Native screen — instead of a Compose layer.
 *
 * The screen behind the host view (plus a margin for blur and scaled glass) is captured by
 * [ViewBackdropCapture] into one RenderNode with its own compositing layer. It is re-recorded only
 * when invalidated (the host moved, something scrolled, glass views came or went), and every glass
 * node of the host samples that same cached texture. So a glass that animates — pressed, dragged,
 * scaled — only re-runs its effects on the GPU, not the capture.
 */
internal class ViewBackdrop(private val host: GlassHostView) : Backdrop {

  // true so Kyant hands us the glass node's coordinates (and redraws when they change).
  override val isCoordinatesDependent: Boolean = true

  /** Bumped to make Compose redraw — and the capture re-record — this backdrop. */
  private var generation by mutableIntStateOf(0)

  private val capture: ViewBackdropCapture? =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) ViewBackdropCapture() else null

  private val captureNode: RenderNode? =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      RenderNode("AndroidGlassBackdrop").apply { setUseCompositingLayer(true, null) }
    } else {
      null
    }

  private val margin: Int = ceil(CAPTURE_MARGIN_DP * host.resources.displayMetrics.density).toInt()
  private var recordedGeneration = -1
  private var recordedWidth = 0
  private var recordedHeight = 0
  private var recordedOffsetX = Int.MIN_VALUE
  private var recordedOffsetY = Int.MIN_VALUE

  private val hostLocation = IntArray(2)
  private val sourceLocation = IntArray(2)
  private var inverseLayerScope: InverseLayerScope? = null

  fun invalidate() {
    generation++
    // Deliver the change now instead of on the next frame, so an invalidation from a
    // pre-draw / scroll listener lands in the frame that is about to be drawn.
    Snapshot.sendApplyNotifications()
  }

  /**
   * Whether the capture is out of date although the host didn't move: something it drew inline
   * (not by reference) changed its children or baked geometry, or a view it left out moved
   * (see ViewBackdropCapture).
   */
  fun changedSinceCapture(): Boolean = capture?.changedSinceCapture() ?: false

  /** Frees the cached capture; the next draw records a fresh one. */
  fun release() {
    captureNode?.discardDisplayList()
    capture?.clear()
    recordedGeneration = -1
  }

  override fun DrawScope.drawBackdrop(
    density: Density,
    coordinates: LayoutCoordinates?,
    layerBlock: (GraphicsLayerScope.() -> Unit)?
  ) {
    // Reading the state subscribes this draw to invalidate().
    val currentGeneration = generation
    // Without RenderEffect (API 31) Kyant cannot blur or bend anything; a sharp copy of the
    // backdrop would just look like a hole, so draw nothing and let the fallback surface show.
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return
    val capture = capture ?: return
    val node = captureNode ?: return
    val source = host.backdropSource ?: return

    host.getLocationOnScreen(hostLocation)
    source.getLocationOnScreen(sourceLocation)
    val offsetX = sourceLocation[0] - hostLocation[0]
    val offsetY = sourceLocation[1] - hostLocation[1]
    val width = host.width + margin * 2
    val height = host.height + margin * 2
    val stale = currentGeneration != recordedGeneration ||
      width != recordedWidth || height != recordedHeight ||
      offsetX != recordedOffsetX || offsetY != recordedOffsetY
    if (stale) {
      if (ViewBackdropCapture.isCapturing) {
        // Re-recorded while another glass view is sampling: capturing now would interleave the
        // two captures. Keep showing the previous capture and sample again on the next frame.
        host.post { invalidate() }
      } else {
        node.setPosition(0, 0, width, height)
        val recordingCanvas = node.beginRecording(width, height)
        try {
          // The capture expects the source's top-left corner at the origin.
          recordingCanvas.translate((margin + offsetX).toFloat(), (margin + offsetY).toFloat())
          capture.draw(recordingCanvas, source, host, GlassRegistry.views)
        } finally {
          node.endRecording()
        }
        recordedGeneration = currentGeneration
        recordedWidth = width
        recordedHeight = height
        recordedOffsetX = offsetX
        recordedOffsetY = offsetY
      }
    }
    if (!node.hasDisplayList()) return

    // The Compose view fills the host, so the glass node's position inside the Compose root is
    // its offset inside the host.
    val nodeOffset =
      if (coordinates != null && coordinates.isAttached) coordinates.positionInRoot() else Offset.Zero

    withTransform({
      // Keep the backdrop still while the glass itself is scaled by its layer block
      // (press / drag feedback), same as Kyant's LayerBackdrop.
      if (layerBlock != null) {
        with(obtainInverseLayerScope()) { inverseTransform(density, layerBlock) }
      }
      translate(-nodeOffset.x - margin, -nodeOffset.y - margin)
    }) {
      drawIntoCanvas { canvas ->
        val nativeCanvas = canvas.nativeCanvas
        if (nativeCanvas.isHardwareAccelerated) nativeCanvas.drawRenderNode(node)
      }
    }
  }

  private fun obtainInverseLayerScope(): InverseLayerScope {
    return inverseLayerScope?.apply { reset() }
      ?: InverseLayerScope().also { inverseLayerScope = it }
  }

  companion object {
    /** Room around the host for blur samples and for glass that grows while pressed. */
    private const val CAPTURE_MARGIN_DP = 32f
  }
}
