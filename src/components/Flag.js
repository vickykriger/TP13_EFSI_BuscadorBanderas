import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { useGame } from '../context/GameContext';

const WIDTH = 280;
const HEIGHT = 180;

export default function Flag() {
  const { currentCountry } = useGame();
  const [svgFailed, setSvgFailed] = useState(false);

  useEffect(() => {
    setSvgFailed(false);
  }, [currentCountry]);

  if (!currentCountry) return null;

  const { flag, iso2 } = currentCountry;
  const isSvg = typeof flag === 'string' && flag.toLowerCase().includes('.svg');
  const fallbackUri = iso2
    ? `https://flagcdn.com/w320/${iso2.toLowerCase()}.png`
    : flag;

  return (
    <View style={styles.container}>
      {isSvg && !svgFailed ? (
        <SvgUri
          uri={flag}
          width={WIDTH}
          height={HEIGHT}
          onError={() => setSvgFailed(true)}
        />
      ) : (
        <Image
          source={{ uri: svgFailed || isSvg ? fallbackUri : flag }}
          style={{ width: WIDTH, height: HEIGHT }}
          resizeMode="contain"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: WIDTH + 16,
    height: HEIGHT + 16,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 3,
    marginVertical: 16,
  },
});