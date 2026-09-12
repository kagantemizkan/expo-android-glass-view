# Capture regression tests

These tests use attached Android views and hardware RenderNodes on an API 31+ device. They
cover detached tab screens, visibility/order changes, drawer transforms, multiple/nested glass
views, culling and release. They also verify that changes inside a referenced subtree do not
request a new capture.

From the repository's `example/android` directory, with dependencies installed and a device
connected:

```sh
./gradlew :expo-android-glass-view:connectedDebugAndroidTest -PreactNativeArchitectures=arm64-v8a
```

Select the ABI of your device/emulator as needed. Reports are in
`android/build/reports/androidTests/connected/debug/` in the library repository.
