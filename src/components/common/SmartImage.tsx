import React, { useMemo, useState } from 'react';
import { Image, ImageProps, ImageSourcePropType, Animated, Platform } from 'react-native';

interface SmartImageProps extends Omit<ImageProps, 'source'> {
  primary: ImageSourcePropType | (() => ImageSourcePropType);
  fallback?: ImageSourcePropType | (() => ImageSourcePropType);
}

export const SmartImage: React.FC<SmartImageProps> = ({ primary, ...rest }) => {
  // Avoid attempting to require local asset files on web — Metro sometimes exposes
  // asset URIs with characters that fail to be served, causing runtime 404s.
  if (Platform.OS === 'web') return null;
  // Try to evaluate the primary source. If the require (or factory) throws, swallow the error
  // and render nothing so the app flow continues without crashing.
  let primarySrc: ImageSourcePropType | undefined;
  try {
    primarySrc = typeof primary === 'function' ? (primary() as ImageSourcePropType) : (primary as ImageSourcePropType);
  } catch (err) {
    // Swallow the require error (happens on web/Metro with problematic filenames)
    primarySrc = undefined;
  }

  if (!primarySrc) {
    // Nothing we can render safely — return null to avoid crashes or warnings.
    return null;
  }

  return (
    <Image
      {...rest}
      source={primarySrc}
      onError={(e) => {
        // Call user's onError if provided
        (rest as any).onError && (rest as any).onError(e);
      }}
      onLoad={(e) => {
        (rest as any).onLoad && (rest as any).onLoad(e);
      }}
    />
  );
};

// Animated variant that mirrors SmartImage behavior but renders an Animated.Image
export const AnimatedSmartImage: React.FC<SmartImageProps> = ({ primary, ...rest }) => {
  // Avoid attempting to require local asset files on web.
  if (Platform.OS === 'web') return null;
  const AnimatedImage = Animated.createAnimatedComponent(Image);

  let primarySrc: ImageSourcePropType | undefined;
  try {
    primarySrc = typeof primary === 'function' ? (primary() as ImageSourcePropType) : (primary as ImageSourcePropType);
  } catch (err) {
    primarySrc = undefined;
  }

  if (!primarySrc) return null;

  return (
    <AnimatedImage
      {...rest}
      source={primarySrc}
      onError={(e) => {
        (rest as any).onError && (rest as any).onError(e);
      }}
      onLoad={(e) => {
        (rest as any).onLoad && (rest as any).onLoad(e);
      }}
    />
  );
};

export default SmartImage;
