package expo.modules.androidglassview

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class BottomTabsGesturePolicyTest {
  @Test
  fun expandedCapsuleCenterIsHit() {
    assertTrue(expandedCapsule().contains(160f, 32f))
  }

  @Test
  fun roundedCornerOutsideCapsuleIsRejected() {
    assertFalse(expandedCapsule().contains(0f, 0f))
  }

  @Test
  fun expandedCapsuleEdgeHonorsHitTolerance() {
    val capsule = expandedCapsule()

    assertTrue(capsule.contains(160f, 0f))
    assertTrue(capsule.contains(-4f, 32f))
    assertFalse(capsule.contains(-4.1f, 32f))
  }

  @Test
  fun minimizedTransparentSidesAreRejected() {
    val capsule = CapsuleHitArea(60f, 20f, 260f, 64f, 22f, 4f)

    assertFalse(capsule.contains(20f, 42f))
    assertFalse(capsule.contains(300f, 42f))
    assertTrue(capsule.contains(160f, 42f))
  }

  @Test
  fun horizontalOffsetMovesTheHitArea() {
    val offsetCapsule = CapsuleHitArea(20f, 0f, 340f, 64f, 64f, 4f)

    assertTrue(offsetCapsule.contains(180f, 32f))
    assertFalse(offsetCapsule.contains(0f, 32f))
  }

  @Test
  fun intermediateAnimationBoundsAreHitAtTheirCurrentSize() {
    val middleBounds = CapsuleHitArea(30f, 10f, 290f, 64f, 64f, 4f)

    assertTrue(middleBounds.contains(160f, 37f))
    assertFalse(middleBounds.contains(20f, 37f))
    assertFalse(middleBounds.contains(300f, 37f))
  }

  @Test
  fun invalidBoundsAndHitParametersNeverMatch() {
    val invalidAreas = listOf(
      CapsuleHitArea(0f, 0f, 0f, 64f, 32f, 4f),
      CapsuleHitArea(0f, 0f, -1f, 64f, 32f, 4f),
      CapsuleHitArea(0f, 0f, 320f, 0f, 32f, 4f),
      CapsuleHitArea(0f, 0f, 320f, -1f, 32f, 4f),
      CapsuleHitArea(Float.NaN, 0f, 320f, 64f, 32f, 4f),
      CapsuleHitArea(0f, 0f, 320f, 64f, -1f, 4f),
      CapsuleHitArea(0f, 0f, 320f, 64f, 32f, Float.POSITIVE_INFINITY),
    )

    invalidAreas.forEach { assertFalse(it.contains(160f, 32f)) }
    assertFalse(expandedCapsule().contains(Float.NaN, 32f))
  }

  private fun expandedCapsule() = CapsuleHitArea(0f, 0f, 320f, 64f, 64f, 4f)
}
