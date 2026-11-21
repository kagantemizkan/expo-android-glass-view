import { requireNativeModule } from 'expo';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Platform, Text } from 'react-native';

import CaseView from '../../lab/CaseView';
import { findCase } from '../../lab/cases';

export default function CaseScreen() {
  const { id, capture } = useLocalSearchParams<{ id: string; capture?: string }>();
  // ?capture=1 forces the capture path (lab), before the case's views are created.
  if (Platform.OS === 'android') {
    requireNativeModule<{ setForceCapture(force: boolean): void }>(
      'ExpoAndroidGlassView'
    ).setForceCapture(capture === '1');
  }
  const testCase = findCase(id);
  return (
    <>
      <Stack.Screen options={{ animation: 'none' }} />
      {testCase ? (
        <CaseView key={testCase.id} testCase={testCase} />
      ) : (
        <Text>Unknown case {id}</Text>
      )}
    </>
  );
}
