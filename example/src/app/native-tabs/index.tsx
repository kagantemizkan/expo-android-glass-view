import { useWindowDimensions } from 'react-native';

import BarBackdrop from '../../lab/BarBackdrop';

/** iOS 26 tab bar centre, measured from the bottom of the screen (iPhone 17 Pro). */
const BAR_CENTER_FROM_BOTTOM = 52;

export default function NativeTabsHome() {
  const { height } = useWindowDimensions();
  return <BarBackdrop barCenterY={height - BAR_CENTER_FROM_BOTTOM} />;
}
