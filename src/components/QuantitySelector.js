// src/components/QuantitySelector.js
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';

/**
 * QuantitySelector props:
 * - qty (number) current value
 * - onChange (fn) required, receives newQty
 * - min (number) default 1
 * - max (number) optional (default: Infinity)
 * - step (number) default 1
 * - disabled (bool) default false
 * - onChangeComplete (fn) optional, called after user finishes interaction
 */
export default function QuantitySelector({
  qty,
  onChange,
  min = 1,
  max = Infinity,
  step = 1,
  disabled = false,
  onChangeComplete,
  style,
  inputStyle,
  btnStyle,
  btnTextStyle,
}) {
  const [value, setValue] = useState(() => sanitize(qty ?? min));
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const acceleratingRef = useRef(1);

  useEffect(() => {
    setValue(sanitize(qty ?? min));
  }, [qty, min]);

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, []);

  function sanitize(n) {
    let num = Number(n);
    if (!Number.isFinite(num)) num = min;
    // align to step increments starting from min
    const aligned = Math.round((num - min) / step) * step + min;
    const clamped = Math.max(min, Math.min(max, aligned));
    return clamped;
  }

  function applyChange(newVal, opts = { complete: false }) {
    const sanitized = sanitize(newVal);
    setValue(sanitized);
    try { onChange && onChange(sanitized); } catch (e) { console.warn('onChange callback error', e); }
    if (opts.complete && typeof onChangeComplete === 'function') {
      try { onChangeComplete(sanitized); } catch (e) { console.warn('onChangeComplete error', e); }
    }
  }

  function increase() { applyChange(value + step); }
  function decrease() { applyChange(value - step); }

  // long-press auto increment/decrement
  function startAuto(fn) {
    if (disabled) return;
    acceleratingRef.current = 1;
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        const multiplier = acceleratingRef.current;
        const delta = step * multiplier;
        fn(delta);
        acceleratingRef.current = Math.min(10, acceleratingRef.current + 0.2);
      }, 120);
    }, 300);
  }

  function stopAuto() {
    clearTimeout(timeoutRef.current);
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    timeoutRef.current = null;
    acceleratingRef.current = 1;
    if (typeof onChangeComplete === 'function') {
      try { onChangeComplete(value); } catch (e) { console.warn('onChangeComplete error', e); }
    }
  }

  const onPressInIncrease = () => startAuto((delta) => applyChange(value + delta));
  const onPressInDecrease = () => startAuto((delta) => applyChange(value - delta));

  const a11yLabel = `Quantity. Current ${value}. Tap plus or minus to change.`;

  return (
    <View style={[styles.container, style]}>
      <Pressable
        testID="qty-decrease"
        accessibilityLabel="Decrease quantity"
        accessibilityRole="button"
        onPress={() => decrease()}
        onPressIn={onPressInDecrease}
        onPressOut={stopAuto}
        disabled={disabled || value <= min}
        style={({ pressed }) => [
          styles.btn,
          btnStyle,
          (disabled || value <= min) && styles.btnDisabled,
          pressed && styles.btnPressed
        ]}
      >
        <Text style={[styles.btnText, btnTextStyle]}>−</Text>
      </Pressable>

      <TextInput
        testID="qty-input"
        accessible={true}
        accessibilityLabel={a11yLabel}
        keyboardType={Platform.select({ ios: 'number-pad', android: 'numeric' })}
        value={String(value)}
        onChangeText={(t) => {
          const maybe = t.replace(/[^\d.-]/g, '');
          if (maybe === '') {
            setValue('');
            return;
          }
          const n = Number(maybe);
          if (!Number.isFinite(n)) return;
          setValue(n);
        }}
        onEndEditing={() => {
          const final = value === '' ? min : value;
          applyChange(final, { complete: true });
        }}
        onSubmitEditing={() => {
          const final = value === '' ? min : value;
          applyChange(final, { complete: true });
        }}
        style={[styles.input, inputStyle]}
      />

      <Pressable
        testID="qty-increase"
        accessibilityLabel="Increase quantity"
        accessibilityRole="button"
        onPress={() => increase()}
        onPressIn={onPressInIncrease}
        onPressOut={stopAuto}
        disabled={disabled || value >= max}
        style={({ pressed }) => [
          styles.btn,
          btnStyle,
          (disabled || value >= max) && styles.btnDisabled,
          pressed && styles.btnPressed
        ]}
      >
        <Text style={[styles.btnText, btnTextStyle]}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btn: {
    width: 38,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 20,
    fontWeight: '700',
  },
  btnPressed: {
    opacity: 0.7,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  input: {
    minWidth: 56,
    marginHorizontal: 8,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    textAlign: 'center',
    fontSize: 16,
  },
});
