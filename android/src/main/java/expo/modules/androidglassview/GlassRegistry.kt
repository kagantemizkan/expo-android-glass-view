package expo.modules.androidglassview

import android.view.View

/**
 * Every glass view currently attached to a window. A backdrop leaves the others out (see
 * ViewBackdropCapture), so adding or removing one changes what the others sample.
 *
 * Main thread only.
 */
internal object GlassRegistry {

  private val attached = LinkedHashSet<GlassHostView>()

  val views: Collection<View>
    get() = attached

  fun add(view: GlassHostView) {
    if (attached.add(view)) invalidateAll()
  }

  fun remove(view: GlassHostView) {
    if (attached.remove(view)) invalidateAll()
  }

  private fun invalidateAll() {
    for (view in attached) {
      view.invalidateBackdrop()
    }
  }
}
