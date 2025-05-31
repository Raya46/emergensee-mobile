import React from "react";
import { StyleSheet, Text, TextProps } from "react-native";

const DEFAULT_FONT_FAMILY = "Manrope_400Regular";

interface CustomTextProps extends TextProps {}

const CustomText: React.FC<CustomTextProps> = (props) => {
  const { style, ...otherProps } = props;

  return (
    <Text style={[styles.defaultText, style]} {...otherProps}>
      {props.children}
    </Text>
  );
};

const styles = StyleSheet.create({
  defaultText: {
    fontFamily: DEFAULT_FONT_FAMILY,
  },
});

export default CustomText;
