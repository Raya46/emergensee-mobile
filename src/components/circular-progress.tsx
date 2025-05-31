import React from "react";
import { View } from "react-native";
import Svg, { Circle, Text as SvgText } from "react-native-svg";

interface CircularProgressProps {
  size: number;
  strokeWidth: number;
  progressPercent: number;
  bgColor?: string;
  progressColor?: string;
  textColor?: string;
  textSize?: number;
  label?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  size,
  strokeWidth,
  progressPercent,
  bgColor = "#e6e6e6",
  progressColor = "#3498db",
  textColor = "#000000",
  textSize = size / 4,
  label = "Skor Diterima",
}) => {
  const radius = (size - strokeWidth) / 2;
  const circum = radius * 2 * Math.PI;
  const svgProgress = circum * (1 - progressPercent / 100);

  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 20,
      }}
    >
      <Svg width={size} height={size}>
        {/* Background Circle */}
        <Circle
          stroke={bgColor}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Progress Circle */}
        <Circle
          stroke={progressColor}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeDasharray={`${circum} ${circum}`}
          strokeDashoffset={svgProgress}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        {/* Percentage Text */}
        <SvgText
          fontSize={textSize}
          x={size / 2}
          y={size / 2 + textSize / 3}
          textAnchor="middle"
          fill={textColor}
          fontWeight="bold"
        >
          {`${Math.round(progressPercent)}%`}
        </SvgText>
      </Svg>
    </View>
  );
};

export default CircularProgress;
