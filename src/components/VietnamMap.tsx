import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Easing, TouchableWithoutFeedback } from 'react-native';
import Svg, { Path, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import vietnamPaths from '../data/vietnamPaths.json';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';

interface ProvincePath {
  id: string;
  label: string;
  d: string;
  centerX: number;
  centerY: number;
}

interface VietnamMapProps {
  visitedProvinces?: string[];
}

export function VietnamMap({ visitedProvinces = [] }: VietnamMapProps) {
  const { colors, isDarkMode } = useTheme();
  const { t } = useTranslation();
  
  // Calculate map dimensions (original SVG is 812x873)
  const windowWidth = Dimensions.get('window').width;
  const mapWidth = windowWidth - 48; // padding 24 on each side
  const mapHeight = mapWidth * (873 / 812);

  const [fadeAnim] = useState(new Animated.Value(0));
  const [selectedProvince, setSelectedProvince] = useState<ProvincePath | null>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Helper to normalize strings for comparison
  const normalizeForMapMatch = (str: string): string => {
    if (!str) return "";
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "d")
      .replace(/tp\.?\s+/gi, "")
      .replace(/[^a-z0-9]/gi, "");
  };

  const getIslandShapes = (islandId: string) => {
    const isHoangSa = islandId === "hoangsa";
    const islandShapes = [
      "M -4,-2 L -2,-4 L 1,-2 L 3,-4 L 4,-2 L 3,1 L 4,3 L 1,2 L -2,4 L -3,1 L -4,1 Z",
      "M 0,-4 L 2,-2 L 4,-3 L 3,0 L 4,2 L 1,1 L 1,4 L -1,2 L -4,3 L -2,0 L -4,-2 L -1,-1 Z",
      "M -3,-3 L 0,-4 L 2,-2 L 4,-2 L 3,1 L 1,1 L 2,3 L -2,2 L -2,1 L -4,1 L -3,-1 Z"
    ];
    
    if (isHoangSa) {
      return [
        { x: 535, y: 440, scale: 1.8, shapeIdx: 0 },
        { x: 575, y: 410, scale: 2.0, shapeIdx: 1 },
        { x: 590, y: 375, scale: 2.0, shapeIdx: 2 },
        { x: 610, y: 425, scale: 2.0, shapeIdx: 0 },
        { x: 618, y: 395, scale: 1.5, shapeIdx: 1 },
      ].map(pt => ({ ...pt, d: islandShapes[pt.shapeIdx] }));
    } else {
      return [
        { x: 660, y: 680, scale: 2.0, shapeIdx: 1 },
        { x: 690, y: 730, scale: 1.8, shapeIdx: 2 },
        { x: 740, y: 710, scale: 2.2, shapeIdx: 0 },
        { x: 780, y: 770, scale: 2.0, shapeIdx: 1 },
        { x: 710, y: 800, scale: 1.8, shapeIdx: 2 },
        { x: 800, y: 720, scale: 1.6, shapeIdx: 0 },
        { x: 670, y: 770, scale: 1.5, shapeIdx: 1 },
      ].map(pt => ({ ...pt, d: islandShapes[pt.shapeIdx] }));
    }
  };

  const renderIslands = (islandId: string) => {
    const points = getIslandShapes(islandId);
    const island = (vietnamPaths as ProvincePath[]).find(p => p.id === islandId);
    
    const isSelected = selectedProvince?.id === islandId;
    
    let fill = isDarkMode ? "#4A3B38" : "#e2b699";
    if (isSelected) fill = "url(#hover-gradient)";

    return (
      <G key={islandId} onPress={() => setSelectedProvince(island || null)}>
        {points.map((pt, idx) => (
          <Path
            key={idx}
            d={pt.d}
            transform={`translate(${pt.x}, ${pt.y}) scale(${pt.scale})`}
            fill={fill}
            stroke={isSelected ? "#FFF" : (isDarkMode ? "#2A1D1A" : "#FFF5F3")}
            strokeWidth={isSelected ? 0.6 : 0.4}
          />
        ))}
      </G>
    );
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, backgroundColor: isDarkMode ? '#1E1210' : '#FFF9F7' }]}>
      <View style={styles.header}>
        <View style={styles.pulseIndicator} />
        <Text style={[styles.title, { color: isDarkMode ? '#FFF' : '#333' }]}>
          Bản đồ Hành trình Việt Nam
        </Text>
      </View>

      {/* SVG Canvas Map */}
      <View style={styles.mapContainer}>
        <Svg viewBox="0 0 812 873" width={mapWidth} height={mapHeight}>
          <Defs>
            <LinearGradient id="hover-gradient" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#ff4d4d" />
              <Stop offset="100%" stopColor="#ffb380" />
            </LinearGradient>
          </Defs>

          {/* Mainland Provinces */}
          <G id="vietnam-provinces">
            {(vietnamPaths as ProvincePath[]).filter(p => p.id !== "hoangsa" && p.id !== "truongsa").map((province) => {
              
              const isVisited = visitedProvinces.some(p => {
                const keyP = normalizeForMapMatch(p);
                const keyLabel = normalizeForMapMatch(province.label);
                return keyP === keyLabel || keyP.includes(keyLabel) || keyLabel.includes(keyP);
              });
              const isSelected = selectedProvince?.id === province.id;

              let fill = isDarkMode ? "#4A3B38" : "#e2b699"; 
              if (isVisited) {
                fill = "#fa7b26"; // Visited highlight color
              }
              if (isSelected) {
                fill = "url(#hover-gradient)";
              }

              return (
                <Path
                  key={province.id}
                  d={province.d}
                  fill={fill}
                  stroke={isDarkMode ? "#2A1D1A" : "#FFF5F3"}
                  strokeWidth={isSelected ? 1.5 : 0.8}
                  onPress={() => setSelectedProvince(province)}
                />
              );
            })}

            {/* Islands */}
            {renderIslands("hoangsa")}
            {renderIslands("truongsa")}
          </G>
        </Svg>
      </View>

      {/* Info Card (replaces hover tooltip) */}
      {selectedProvince && (
        <View style={[styles.infoCard, { backgroundColor: isDarkMode ? '#2A1D1A' : '#FFF', borderColor: isDarkMode ? '#4A3B38' : '#FEE2E2' }]}>
          <Text style={[styles.infoCardTitle, { color: isDarkMode ? '#FFF' : '#1F2937' }]}>
            {selectedProvince.label}
          </Text>
          <TouchableWithoutFeedback onPress={() => setSelectedProvince(null)}>
            <View style={styles.closeBtn}>
              <Text style={{color: '#9ca3af', fontSize: 16}}>✕</Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 24,
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,49,49,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  pulseIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff3131',
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  mapContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  infoCard: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeBtn: {
    marginLeft: 16,
    padding: 4,
  }
});
