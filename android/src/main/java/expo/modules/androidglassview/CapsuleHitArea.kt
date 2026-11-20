package expo.modules.androidglassview

import kotlin.math.min

/** Rounded hit area for the visible bottom-tab capsule, expressed in pixels. */
internal data class CapsuleHitArea(
  val left: Float,
  val top: Float,
  val right: Float,
  val bottom: Float,
  val cornerRadiusPx: Float,
  val tolerancePx: Float
) {
  fun contains(x: Float, y: Float): Boolean {
    if (
      !x.isFinite() ||
      !y.isFinite() ||
      !left.isFinite() ||
      !top.isFinite() ||
      !right.isFinite() ||
      !bottom.isFinite() ||
      !cornerRadiusPx.isFinite() ||
      !tolerancePx.isFinite() ||
      cornerRadiusPx < 0f ||
      tolerancePx < 0f ||
      right <= left ||
      bottom <= top
    ) {
      return false
    }

    val hitLeft = left - tolerancePx
    val hitTop = top - tolerancePx
    val hitRight = right + tolerancePx
    val hitBottom = bottom + tolerancePx
    if (
      !hitLeft.isFinite() ||
      !hitTop.isFinite() ||
      !hitRight.isFinite() ||
      !hitBottom.isFinite() ||
      hitRight <= hitLeft ||
      hitBottom <= hitTop ||
      x < hitLeft ||
      x >= hitRight ||
      y < hitTop ||
      y >= hitBottom
    ) {
      return false
    }

    val radius = min(
      cornerRadiusPx + tolerancePx,
      min(hitRight - hitLeft, hitBottom - hitTop) / 2f
    )
    val centerX = when {
      x < hitLeft + radius -> hitLeft + radius
      x > hitRight - radius -> hitRight - radius
      else -> x
    }
    val centerY = when {
      y < hitTop + radius -> hitTop + radius
      y > hitBottom - radius -> hitBottom - radius
      else -> y
    }
    val dx = x - centerX
    val dy = y - centerY
    return dx * dx + dy * dy <= radius * radius
  }
}
