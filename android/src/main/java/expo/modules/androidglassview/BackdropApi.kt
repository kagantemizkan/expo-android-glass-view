package expo.modules.androidglassview

import android.graphics.RenderEffect
import android.graphics.RenderNode
import android.os.Build
import android.view.View
import java.lang.reflect.InvocationTargetException
import java.lang.reflect.Method

/**
 * `View.setBackdropRenderEffect` / `RenderNode.setBackdropRenderEffect` ("Added in version 37.2").
 *
 * Called through reflection so the module still compiles against the current compileSdk and runs
 * on older devices: there the methods are simply missing and [isSupported] is false.
 */
internal object BackdropApi {

  private val viewSetter: Method? = lookup { View::class.java }

  private val renderNodeSetter: Method? = lookup { RenderNode::class.java }

  /**
   * Lab switch: behave as if the platform backdrop were missing, so the capture path can be
   * tested on a 37.2 device too.
   */
  var forceCapture = false

  /** True when this device has `View.setBackdropRenderEffect` (and it is not switched off). */
  val isSupported: Boolean get() = viewSetter != null && !forceCapture

  val hasRenderNodeSetter: Boolean get() = renderNodeSetter != null && !forceCapture

  /** `Build.VERSION.SDK_INT_FULL` (major * 100000 + minor), or SDK_INT * 100000 before 36.1. */
  val sdkIntFull: Int =
    runCatching { Build.VERSION::class.java.getField("SDK_INT_FULL").getInt(null) }
      .getOrElse { Build.VERSION.SDK_INT * 100_000 }

  /** e.g. "37.2". */
  val sdkFull: String get() = "${sdkIntFull / 100_000}.${sdkIntFull % 100_000}"

  /** Throws the real exception of the platform call (not the reflection wrapper). */
  fun set(view: View, effect: RenderEffect?) {
    val setter = viewSetter ?: throw UnsupportedOperationException(
      "View.setBackdropRenderEffect is not available on SDK $sdkFull"
    )
    try {
      setter.invoke(view, effect)
    } catch (e: InvocationTargetException) {
      throw e.targetException ?: e
    }
  }

  /** `RenderNode.setBackdropRenderEffect`; throws where it does not exist. */
  fun set(node: RenderNode, effect: RenderEffect?) {
    val setter = renderNodeSetter ?: throw UnsupportedOperationException(
      "RenderNode.setBackdropRenderEffect is not available on SDK $sdkFull"
    )
    try {
      setter.invoke(node, effect)
    } catch (e: InvocationTargetException) {
      throw e.targetException ?: e
    }
  }

  private fun lookup(owner: () -> Class<*>): Method? {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return null // RenderEffect is API 31
    return try {
      owner().getMethod("setBackdropRenderEffect", RenderEffect::class.java)
    } catch (_: Throwable) {
      null
    }
  }
}
