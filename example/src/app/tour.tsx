import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';

import CaseView from '../lab/CaseView';
import { CASES } from '../lab/cases';

// Lab: shows every `iOS vs Android` case in turn, 4 s each, so a device that asks before opening
// each deep link (the iOS simulator) can be captured from a single link.
const TOUR = CASES.filter((c) => c.variant === 'compare');
const STEP_MS = 4000;

export default function Tour() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % TOUR.length), STEP_MS);
    return () => clearInterval(timer);
  }, []);
  const testCase = TOUR[index];
  return (
    <>
      <Stack.Screen options={{ animation: 'none' }} />
      <CaseView key={testCase.id} testCase={testCase} />
    </>
  );
}
