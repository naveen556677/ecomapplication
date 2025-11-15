// src/components/ImageCarousel.js
import React, {
  forwardRef,
  useRef,
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
} from 'react';
import {
  View,
  Image,
  FlatList,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const DEFAULT_HEIGHT = Math.round(WINDOW_WIDTH * 0.8); // taller for product images
const FALLBACK = 'https://picsum.photos/1200/1200';

// default dummy slides
const DEFAULT_DUMMY = [
  'https://picsum.photos/id/1015/1200/800',
  'https://picsum.photos/id/1011/1200/800',
  'https://picsum.photos/id/1003/1200/800',
];

const normalizeSlide = (s) => (typeof s === 'string' ? { uri: s } : (s && s.uri ? s : { uri: FALLBACK }));

// safe read Animated.Value
const getAnimatedValue = (av) => {
  try {
    return typeof av.__getValue === 'function' ? av.__getValue() : 0;
  } catch {
    return 0;
  }
};

/**
 * ZoomableImage
 * - uri: image url
 * - resetTrigger: increments to reset zoom when parent changes page
 * - onZoomChange(zoomed:boolean): notify parent when zoom state changes
 */
const ZoomableImage = ({ uri, resetTrigger, onZoomChange }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const baseScaleRef = useRef(1);
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const lastTranslate = useRef({ x: 0, y: 0 });
  const lastTap = useRef(0);
  const [isLoading, setIsLoading] = useState(true);

  // notify parent safely
  const notifyZoom = useCallback((zoomed) => {
    try { onZoomChange?.(zoomed); } catch (_) {}
  }, [onZoomChange]);

  // Pinch gesture
  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      const next = Math.max(1, Math.min(baseScaleRef.current * e.scale, 4));
      scale.setValue(next);
    })
    .onEnd((e) => {
      const next = Math.max(1, Math.min(baseScaleRef.current * (e.scale ?? 1), 4));
      baseScaleRef.current = next;
      scale.setValue(next);
      notifyZoom(baseScaleRef.current > 1);
    });

  // Pan gesture for dragging when zoomed
  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (baseScaleRef.current > 1) {
        translateX.setValue(lastTranslate.current.x + (e.translationX ?? 0));
        translateY.setValue(lastTranslate.current.y + (e.translationY ?? 0));
      }
    })
    .onEnd(() => {
      lastTranslate.current = { x: getAnimatedValue(translateX), y: getAnimatedValue(translateY) };
    });

  const gesture = Gesture.Simultaneous(pinch, pan);

  // double-tap to toggle zoom
  const handleDoubleTap = () => {
    const now = Date.now();
    if (lastTap.current && now - lastTap.current < 300) {
      const toValue = baseScaleRef.current > 1 ? 1 : 2.4;
      Animated.spring(scale, { toValue, useNativeDriver: false }).start(() => {
        baseScaleRef.current = toValue;
        if (toValue === 1) {
          translateX.setValue(0);
          translateY.setValue(0);
          lastTranslate.current = { x: 0, y: 0 };
          notifyZoom(false);
        } else {
          notifyZoom(true);
        }
      });
    }
    lastTap.current = now;
  };

  // reset when parent requests (page changed)
  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, { toValue: 1, duration: 140, useNativeDriver: false }),
      Animated.timing(translateX, { toValue: 0, duration: 140, useNativeDriver: false }),
      Animated.timing(translateY, { toValue: 0, duration: 140, useNativeDriver: false }),
    ]).start(() => {
      baseScaleRef.current = 1;
      lastTranslate.current = { x: 0, y: 0 };
      notifyZoom(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetTrigger]);

  return (
    <View style={styles.slide}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={styles.flex}>
          <TouchableWithoutFeedback onPress={handleDoubleTap}>
            <Animated.View
              style={{
                width: WINDOW_WIDTH,
                height: DEFAULT_HEIGHT,
                justifyContent: 'center',
                alignItems: 'center',
                transform: [
                  { translateX: translateX },
                  { translateY: translateY },
                  { scale: scale },
                ],
              }}
            >
              {isLoading && <ActivityIndicator style={styles.loader} size="large" />}
              <Image
                source={{ uri: uri || FALLBACK }}
                style={[styles.image, { width: WINDOW_WIDTH, height: DEFAULT_HEIGHT }]}
                resizeMode="contain"
                onLoadStart={() => setIsLoading(true)}
                onLoadEnd={() => setIsLoading(false)}
                onError={(e) => {
                  console.warn('Image load error', e.nativeEvent || e);
                  setIsLoading(false);
                }}
              />
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const ImageCarousel = forwardRef(({
  slides = [],
  autoPlay = true,
  autoPlayInterval = 3000,
  showIndicators = true,
}, ref) => {
  const listRef = useRef(null);
  const timerRef = useRef(null);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [scrollEnabled, setScrollEnabled] = useState(true); // allow manual scroll only when not zoomed
  const [currentIndex, setCurrentIndex] = useState(0);
  const userInteractingRef = useRef(false);

  const dataSource = (Array.isArray(slides) && slides.length > 0 ? slides : DEFAULT_DUMMY);
  const data = dataSource.map(normalizeSlide);
  const length = data.length;

  // expose methods
  useImperativeHandle(ref, () => ({
    scrollToIndex: (i) => {
      const idx = Math.max(0, Math.min(i || 0, length - 1));
      try { listRef.current?.scrollToIndex?.({ index: idx, animated: true }); } catch (e) {
        listRef.current?.scrollToOffset?.({ offset: idx * WINDOW_WIDTH, animated: true });
      }
      setCurrentIndex(idx);
      setResetTrigger((p) => p + 1);
    },
    resetZoomForCurrent: () => setResetTrigger((p) => p + 1),
  }), [length]);

  // autoplay handling
  const clearAutoPlay = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startAutoPlay = useCallback((delay = autoPlayInterval) => {
    if (!autoPlay || length <= 1) return;
    clearAutoPlay();
    timerRef.current = setInterval(() => {
      if (userInteractingRef.current || !scrollEnabled) return;
      setCurrentIndex((prev) => {
        const next = (prev + 1) % length;
        try { listRef.current?.scrollToIndex?.({ index: next, animated: true }); } catch (e) {
          listRef.current?.scrollToOffset?.({ offset: next * WINDOW_WIDTH, animated: true });
        }
        return next;
      });
    }, delay);
  }, [autoPlay, autoPlayInterval, length, scrollEnabled, clearAutoPlay]);

  useEffect(() => {
    startAutoPlay();
    return () => clearAutoPlay();
  }, [startAutoPlay, clearAutoPlay]);

  // user interaction handlers
  const onScrollBeginDrag = () => {
    userInteractingRef.current = true;
    clearAutoPlay();
  };

  const onMomentumScrollEnd = (ev) => {
    const x = ev.nativeEvent.contentOffset.x ?? 0;
    const idx = Math.round(x / WINDOW_WIDTH);
    setCurrentIndex(idx);
    // reset zoom for new slide
    setResetTrigger((p) => p + 1);

    // resume autoplay after short idle
    userInteractingRef.current = false;
    clearAutoPlay();
    timerRef.current = setInterval(() => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      startAutoPlay();
    }, 3500);
  };

  // child notify: whether zoom active
  const handleZoomChange = useCallback((zoomed) => {
    setScrollEnabled(!zoomed);
    if (zoomed) {
      userInteractingRef.current = true;
      clearAutoPlay();
    } else {
      userInteractingRef.current = false;
      // restart autoplay after slight delay
      clearAutoPlay();
      timerRef.current = setInterval(() => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        startAutoPlay();
      }, 1500);
    }
  }, [clearAutoPlay, startAutoPlay]);

  // left/right controls (respect zoom state)
  const goPrev = () => {
    const prev = Math.max(0, currentIndex - 1);
    try { listRef.current?.scrollToIndex?.({ index: prev, animated: true }); } catch (e) {
      listRef.current?.scrollToOffset?.({ offset: prev * WINDOW_WIDTH, animated: true });
    }
    setCurrentIndex(prev);
    setResetTrigger((p) => p + 1);
    userInteractingRef.current = true;
    clearAutoPlay();
    setTimeout(() => { userInteractingRef.current = false; startAutoPlay(); }, 1000);
  };

  const goNext = () => {
    const nxt = (currentIndex + 1) % length;
    try { listRef.current?.scrollToIndex?.({ index: nxt, animated: true }); } catch (e) {
      listRef.current?.scrollToOffset?.({ offset: nxt * WINDOW_WIDTH, animated: true });
    }
    setCurrentIndex(nxt);
    setResetTrigger((p) => p + 1);
    userInteractingRef.current = true;
    clearAutoPlay();
    setTimeout(() => { userInteractingRef.current = false; startAutoPlay(); }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const renderItem = ({ item, index }) => (
    <ZoomableImage
      uri={item.uri}
      resetTrigger={`${resetTrigger}-${index}`}
      onZoomChange={handleZoomChange}
    />
  );

  return (
    <View style={{ backgroundColor: '#fff' }}>
      <FlatList
        data={data}
        ref={listRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        onScrollBeginDrag={onScrollBeginDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
        initialNumToRender={1}
        windowSize={2}
        removeClippedSubviews
        scrollEnabled={scrollEnabled}
        getItemLayout={(_, i) => ({ length: WINDOW_WIDTH, offset: WINDOW_WIDTH * i, index: i })}
        showsVerticalScrollIndicator={false}
      />

      {/* left/right chevrons */}
      <TouchableOpacity style={[styles.chev, styles.chevLeft]} activeOpacity={0.85} onPress={goPrev}>
        <Text style={styles.chevText}>‹</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.chev, styles.chevRight]} activeOpacity={0.85} onPress={goNext}>
        <Text style={styles.chevText}>›</Text>
      </TouchableOpacity>

      {/* indicators */}
      {showIndicators && (
        <View style={styles.indicatorRow}>
          {data.map((_, i) => {
            const active = i === currentIndex;
            return (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  try { listRef.current?.scrollToIndex?.({ index: i, animated: true }); } catch (e) {
                    listRef.current?.scrollToOffset?.({ offset: i * WINDOW_WIDTH, animated: true });
                  }
                  setCurrentIndex(i);
                  setResetTrigger((p) => p + 1);
                }}
                style={styles.dotWrap}
                activeOpacity={0.85}
              >
                <View style={[styles.dot, active ? styles.dotActive : null]} />
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  slide: {
    width: WINDOW_WIDTH,
    height: DEFAULT_HEIGHT,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flex: { flex: 1 },
  image: {
    // width & height passed inline
  },
  loader: { position: 'absolute', zIndex: 10 },
  chev: {
    position: 'absolute',
    top: '48%',
    transform: [{ translateY: -24 }],
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.6)',
    zIndex: 10,
  },
  chevLeft: { left: 10 },
  chevRight: { right: 10 },
  chevText: { color: '#fff', fontSize: 28, fontWeight: '900', lineHeight: 28 },

  indicatorRow: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  dotWrap: { marginHorizontal: 6 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: '#cbd5e1',
  },
  dotActive: {
    width: 20,
    borderRadius: 10,
    backgroundColor: '#111827',
  },
});

export default ImageCarousel;
