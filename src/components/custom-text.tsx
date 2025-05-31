import React from "react";
import { StyleSheet, Text, TextProps } from "react-native";

// Gunakan nama font yang sesuai dengan yang dimuat di _layout.tsx
const DEFAULT_FONT_FAMILY = "Manrope_400Regular";

// Tambahkan tipe untuk props
interface CustomTextProps extends TextProps {
  // Anda bisa menambahkan props kustom di sini jika perlu
  // contoh: fontWeight?: 'normal' | 'bold';
}

const CustomText: React.FC<CustomTextProps> = (props) => {
  const { style, ...otherProps } = props;

  // Logika untuk memilih font weight jika Anda ingin menambahkannya
  // let fontFamily = DEFAULT_FONT_FAMILY;
  // if (style && style.fontWeight === 'bold') {
  //   fontFamily = "Manrope_700Bold";
  // } else if (props.fontWeight === 'bold') { // contoh jika ada prop kustom
  //   fontFamily = "Manrope_700Bold";
  // }

  return (
    <Text style={[styles.defaultText, style]} {...otherProps}>
      {props.children} {/* Render child elements (teks itu sendiri) */}
    </Text>
  );
};

const styles = StyleSheet.create({
  defaultText: {
    fontFamily: DEFAULT_FONT_FAMILY,
    // Anda bisa menghapus fontWeight dari sini jika ingin mengontrolnya via style prop
    // atau menambahkan logika seperti di atas.
  },
});

export default CustomText;
