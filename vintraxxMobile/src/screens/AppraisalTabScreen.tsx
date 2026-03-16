// AppraisalTabScreen for VinTraxx SmartScan
// Tab screen for Vehicle Appraisal - navigates to full AppraiserScreen
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { logger, LogCategory } from '../utils/Logger';

// Import SVG icons
import TipIcon from '../assets/icons/tip.svg';

interface AppraisalTabScreenProps {
  navigation: any;
}

export const AppraisalTabScreen: React.FC<AppraisalTabScreenProps> = ({ navigation }) => {
  useEffect(() => {
    logger.info(LogCategory.APP, 'AppraisalTabScreen: Screen opened');
  }, []);

  const handleStartAppraisal = () => {
    logger.info(LogCategory.APP, 'Appraisal tab: User tapped to start appraisal', {
      source: 'AppraisalTab',
      destination: 'AppraiserScreen',
    });
    navigation.navigate('Appraiser', {});
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Vehicle Appraisal</Text>
          <Text style={styles.headerSubtitle}>
            Get your vehicle's market value
          </Text>
        </View>

        {/* Appraisal Button */}
        <View style={styles.scanSection}>
          <View style={styles.idleScanContainer}>
            <TouchableOpacity
              onPress={handleStartAppraisal}
              activeOpacity={0.8}
              style={styles.scanImageButton}
            >
              <Image
                source={require('../assets/images/scan.png')}
                style={styles.scanImage}
                resizeMode="contain"
              />
              <Text style={styles.scanButtonHint}>Tap to Start Appraisal</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <TipIcon width={25} height={25} color={colors.status.info} />
            <Text style={styles.tipsTitle}>Before Appraisal</Text>
          </View>
          <View style={styles.tipsList}>
            <Text style={styles.tipItem}>
              • Have the vehicle VIN ready
            </Text>
            <Text style={styles.tipItem}>
              • Know the current mileage
            </Text>
            <Text style={styles.tipItem}>
              • Take photos of the vehicle exterior and interior
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing['3xl'],
  },
  header: {
    paddingVertical: spacing.lg,
  },
  headerTitle: {
    ...typography.styles.h2,
    color: colors.primary.navy,
  },
  headerSubtitle: {
    ...typography.styles.body,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  scanSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  idleScanContainer: {
    alignItems: 'center',
    width: '100%',
  },
  scanImageButton: {
    alignItems: 'center',
  },
  scanImage: {
    width: 180,
    height: 180,
  },
  scanButtonHint: {
    ...typography.styles.label,
    color: colors.primary.navy,
    marginTop: spacing.md,
    fontWeight: typography.fontWeight.semiBold,
  },
  tipsCard: {
    backgroundColor: colors.status.infoLight,
    padding: spacing.cardPadding,
    borderLeftWidth: 4,
    borderLeftColor: colors.status.info,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tipsTitle: {
    ...typography.styles.label,
    color: colors.status.info,
  },
  tipsList: {
    gap: spacing.xs,
  },
  tipItem: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
  },
});
