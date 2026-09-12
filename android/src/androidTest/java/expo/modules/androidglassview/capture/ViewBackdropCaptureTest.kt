package expo.modules.androidglassview.capture

import android.app.Activity
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Rect
import android.graphics.RenderNode
import android.os.Handler
import android.os.Looper
import android.view.PixelCopy
import android.view.View
import android.widget.FrameLayout
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.SdkSuppress
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

class CaptureTestActivity : Activity()

/** Real attached views and hardware display lists: the failure depends on ViewGroup dispatch. */
@RunWith(AndroidJUnit4::class)
@SdkSuppress(minSdkVersion = 31)
class ViewBackdropCaptureTest {
  private class Fixture(val activity: Activity) {
    val root = FrameLayout(activity)
    val screenContainer = FrameLayout(activity)
    val screen = FrameLayout(activity)
    val list = FrameLayout(activity)
    val capture = ViewBackdropCapture()
    val node = RenderNode("CaptureRegressionTest")
    val glass = object : View(activity) {
      override fun onDraw(canvas: Canvas) {
        if (canvas.isHardwareAccelerated && node.hasDisplayList()) canvas.drawRenderNode(node)
      }
    }
    val glasses = arrayListOf(glass)

    init {
      root.setBackgroundColor(Color.WHITE)
      list.setBackgroundColor(Color.BLUE)
      screen.addView(list, FrameLayout.LayoutParams(300, 600))
      screenContainer.addView(screen, FrameLayout.LayoutParams(300, 300))
      root.addView(screenContainer, FrameLayout.LayoutParams(300, 300))
      root.addView(glass, FrameLayout.LayoutParams(300, 100))
      activity.setContentView(root)
    }

    fun record() {
      node.setPosition(0, 0, 300, 300)
      val canvas = node.beginRecording(300, 300)
      try {
        capture.draw(canvas, root, glass, glasses)
      } finally {
        node.endRecording()
      }
      assertFalse("A fresh capture must settle", capture.changedSinceCapture())
      glass.invalidate()
    }

    fun changed(change: () -> Unit) {
      change()
      assertTrue("The frozen dispatch/transform must be refreshed", capture.changedSinceCapture())
      record()
    }
  }

  private fun withFixture(test: (Fixture) -> Unit) {
    ActivityScenario.launch(CaptureTestActivity::class.java).use { scenario ->
      lateinit var fixture: Fixture
      scenario.onActivity { fixture = Fixture(it) }
      InstrumentationRegistry.getInstrumentation().waitForIdleSync()
      scenario.onActivity {
        try {
          // waitForIdleSync does not guarantee a layout traversal has run. Give these
          // synchronous state tests deterministic, nonzero bounds before capturing.
          val spec = View.MeasureSpec.makeMeasureSpec(1000, View.MeasureSpec.EXACTLY)
          fixture.root.measure(spec, spec)
          fixture.root.layout(0, 0, 1000, 1000)
          fixture.record()
          test(fixture)
        } finally {
          fixture.capture.clear()
          fixture.node.discardDisplayList()
        }
      }
    }
  }

  @Test fun tabReplacementWithSameChildCountInvalidates() = withFixture { f ->
    f.changed {
      f.screenContainer.removeView(f.screen)
      f.screenContainer.addView(FrameLayout(f.activity), FrameLayout.LayoutParams(300, 300))
    }
    f.changed { f.screenContainer.removeAllViews() }
    f.changed { f.screenContainer.addView(f.screen) }
  }

  @Test fun inlineVisibilityOrderAndElevationInvalidate() = withFixture { f ->
    f.changed { f.screen.visibility = View.INVISIBLE }
    f.changed { f.screen.visibility = View.VISIBLE }
    f.changed { f.screen.visibility = View.GONE }
    f.changed { f.screen.visibility = View.VISIBLE }
    val sibling = View(f.activity)
    f.changed { f.screenContainer.addView(sibling) }
    f.changed { f.screenContainer.bringChildToFront(f.screen) }
    f.changed { f.screen.elevation = 8f }
  }

  @Test fun customDrawingOrderInvalidatesWithoutReorderingChildren() = withFixture { f ->
    val ordered = object : FrameLayout(f.activity) {
      var reversed = false
      init { isChildrenDrawingOrderEnabled = true }
      override fun getChildDrawingOrder(childCount: Int, drawingPosition: Int): Int =
        if (reversed) childCount - drawingPosition - 1 else drawingPosition
    }
    ordered.addView(View(f.activity))
    ordered.addView(View(f.activity))
    f.root.addView(ordered)
    ordered.layout(0, 0, 300, 300)
    f.record()
    f.changed { ordered.reversed = true }
    f.changed { ordered.clipChildren = false }
    f.changed { ordered.clipToPadding = false }
  }

  @Test fun replacementScreenReachesCachedBackdropPixels() {
    ActivityScenario.launch(CaptureTestActivity::class.java).use { scenario ->
      lateinit var fixture: Fixture
      val location = IntArray(2)
      scenario.onActivity { fixture = Fixture(it) }
      // An idle UI thread can still be waiting for vsync. Wait for the rendered frame, both
      // for replacement-screen layout and before reading pixels from the window buffer.
      fun commitFrame(action: () -> Unit) {
        val committed = CountDownLatch(1)
        scenario.onActivity {
          fixture.root.viewTreeObserver.registerFrameCommitCallback { committed.countDown() }
          action()
          fixture.root.invalidate()
        }
        assertTrue("Frame was not committed", committed.await(10, TimeUnit.SECONDS))
      }
      commitFrame { }
      commitFrame {
        fixture.record()
        fixture.glass.getLocationInWindow(location)
      }
      fun assertBackdropColor(color: Int) {
        // Copy the window itself: a device screenshot also includes Activity transition
        // animations and may still show the launcher even after our frame was committed.
        val screenshot = Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888)
        val copied = CountDownLatch(1)
        var result = PixelCopy.ERROR_UNKNOWN
        val x = location[0] + 50
        val y = location[1] + 50
        try {
          PixelCopy.request(fixture.activity.window, Rect(x, y, x + 1, y + 1), screenshot, {
            result = it
            copied.countDown()
          }, Handler(Looper.getMainLooper()))
          assertTrue("Window copy timed out", copied.await(10, TimeUnit.SECONDS))
          assertEquals(PixelCopy.SUCCESS, result)
          assertEquals(color, screenshot.getPixel(0, 0))
        } finally {
          screenshot.recycle()
        }
      }
      try {
        assertBackdropColor(Color.BLUE)
        commitFrame {
          fixture.screenContainer.removeAllViews()
          fixture.screenContainer.addView(View(fixture.activity).apply { setBackgroundColor(Color.RED) },
            FrameLayout.LayoutParams(300, 300))
        }
        commitFrame {
          assertTrue(fixture.capture.changedSinceCapture())
          fixture.record()
        }
        assertBackdropColor(Color.RED)
      } finally {
        scenario.onActivity {
          fixture.capture.clear()
          fixture.node.discardDisplayList()
        }
      }
    }
  }

  @Test fun manuallyDrawnDrawerTransformsAndAlphaInvalidate() = withFixture { f ->
    // Still inside the cull margin: tracking only rejected views misses this drawer.
    f.changed { f.screenContainer.translationX = -4f }
    f.changed { f.screenContainer.translationX = 0f }
    f.changed { f.screenContainer.alpha = 0.4f }
    f.changed { f.screenContainer.scaleX = 0.9f }
    f.changed { f.screenContainer.pivotX = 17f }
    f.changed { f.screenContainer.rotation = 5f }
    f.changed { f.screenContainer.scrollTo(0, 8) }
  }

  @Test fun referencedSubtreeScrollAndContentStayLiveWithoutRecapture() = withFixture { f ->
    // screenContainer is inline; screen and everything under it are RenderNode references.
    repeat(100) {
      f.list.scrollTo(0, it)
      f.list.translationY = it.toFloat()
      f.list.setBackgroundColor(if (it % 2 == 0) Color.RED else Color.BLUE)
      assertFalse(f.capture.changedSinceCapture())
    }
    f.screen.addView(View(f.activity))
    assertFalse(f.capture.changedSinceCapture())
  }

  @Test fun expandedSiblingRestoresVisibilityAndTracksItsChildren() = withFixture { f ->
    val otherGlass = View(f.activity)
    f.screenContainer.addView(otherGlass)
    f.glasses.add(otherGlass)
    f.record()
    assertEquals(View.VISIBLE, otherGlass.visibility)
    repeat(100) { assertFalse(f.capture.changedSinceCapture()) }
    // An expanded group's ordinary children are still referenced; their scrolling stays live.
    f.screen.scrollTo(0, 7)
    assertFalse(f.capture.changedSinceCapture())
    f.changed { f.screenContainer.removeView(f.screen) }
    assertEquals(View.VISIBLE, otherGlass.visibility)
  }

  @Test fun culledViewEnteringCaptureInvalidates() = withFixture { f ->
    val outside = View(f.activity)
    outside.layout(1000, 0, 1100, 100)
    f.root.addView(outside)
    f.record()
    outside.alpha = 0.5f
    assertFalse("A culled view fading must not trigger capture", f.capture.changedSinceCapture())
    f.changed { outside.translationX = -1000f }
  }

  @Test fun nestedGlassAncestorsAreNeverReenteredAndOtherGlassIsExcluded() = withFixture { f ->
    val ancestor = object : FrameLayout(f.activity) {
      override fun draw(canvas: Canvas) {
        check(!ViewBackdropCapture.isCapturing) { "Must not reenter a glass ancestor's draw" }
        super.draw(canvas)
      }
    }
    val excluded = object : View(f.activity) {
      override fun draw(canvas: Canvas) {
        check(!ViewBackdropCapture.isCapturing) { "Must not sample another glass" }
        super.draw(canvas)
      }
    }
    f.root.removeView(f.glass)
    f.root.addView(ancestor)
    ancestor.layout(0, 0, 300, 300)
    ancestor.addView(f.glass)
    f.root.addView(excluded)
    f.glasses.add(ancestor)
    f.glasses.add(excluded)
    f.record()
  }

  @Test fun clearReleasesOldCaptureState() = withFixture { f ->
    f.capture.clear()
    f.screenContainer.removeAllViews()
    f.screenContainer.translationX = 10f
    assertFalse(f.capture.changedSinceCapture())
  }
}
