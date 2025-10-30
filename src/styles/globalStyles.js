import { StyleSheet } from 'react-native';
import { COLORS, FONT_SIZES } from '../utils/constants';

export const createStyles = (isDark) => {
  const colors = isDark ? COLORS.dark : COLORS.light;
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 20,
    },
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      fontSize: FONT_SIZES.xlarge,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    subHeader: {
      fontSize: FONT_SIZES.large,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 15,
    },
    text: {
      fontSize: FONT_SIZES.medium,
      color: colors.text,
      marginBottom: 10,
    },
    button: {
      backgroundColor: colors.primary,
      padding: 20,
      borderRadius: 15,
      alignItems: 'center',
      marginVertical: 10,
      minHeight: 70,
      justifyContent: 'center',
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: FONT_SIZES.large,
      fontWeight: 'bold',
    },
    dangerButton: {
      backgroundColor: colors.danger,
      padding: 25,
      borderRadius: 15,
      alignItems: 'center',
      marginVertical: 10,
      minHeight: 80,
      justifyContent: 'center',
    },
    card: {
      backgroundColor: colors.card,
      padding: 20,
      borderRadius: 15,
      marginVertical: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    input: {
      backgroundColor: colors.card,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 20,
      fontSize: FONT_SIZES.medium,
      color: colors.text,
      marginVertical: 10,
      minHeight: 65,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 5,
    },
    iconButton: {
      padding: 15,
      borderRadius: 10,
      backgroundColor: colors.primary,
      margin: 5,
      minWidth: 60,
      minHeight: 60,
      justifyContent: 'center',
      alignItems: 'center',
    },
    successButton: {
      backgroundColor: colors.success,
    },
    warningButton: {
      backgroundColor: colors.warning,
    },
    secondaryButton: {
      backgroundColor: colors.secondary,
    },
    disabledButton: {
      backgroundColor: colors.border,
      opacity: 0.5,
    },
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollView: {
      flex: 1,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      backgroundColor: colors.background,
      padding: 30,
      borderRadius: 20,
      width: '90%',
      maxHeight: '80%',
    },
    listItem: {
      backgroundColor: colors.card,
      padding: 20,
      borderRadius: 12,
      marginVertical: 8,
      borderLeftWidth: 5,
      borderLeftColor: colors.primary,
    },
    badge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 20,
      marginHorizontal: 5,
    },
    badgeText: {
      color: '#FFFFFF',
      fontSize: FONT_SIZES.small,
      fontWeight: '600',
    },
  });
};