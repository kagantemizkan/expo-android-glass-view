package expo.modules.androidglassview

/**
 * A prop the user can also change natively, like a switch's `value`.
 *
 * Every native change is sent to JS with an increasing event count, and the JS side passes back
 * the count of the last event it has handled as the `mostRecentEventCount` prop — the handshake
 * React Native's TextInput uses. The prop only counts once JS has seen every native change; before
 * that it is stale (JS still working through earlier events, e.g. after quick taps or on a busy JS
 * thread) and would pull the view back from where the user just put it.
 */
internal class ControlledProp<T>(initialValue: T) {

  /** Latest value of the prop. */
  var value: T = initialValue

  /** Latest `mostRecentEventCount` prop: the last native change the JS side has handled. */
  var mostRecentEventCount = 0

  /** Native changes sent to JS so far. */
  var eventCount = 0
    private set

  /** Whether [value] already reflects every native change, i.e. can be applied. */
  val isCurrent: Boolean
    get() = mostRecentEventCount >= eventCount

  /** Counts one native change; send the result with its event. */
  fun nextEventCount(): Int = ++eventCount
}
