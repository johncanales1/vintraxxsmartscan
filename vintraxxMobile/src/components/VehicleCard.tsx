// VehicleCard component for VinTraxx SmartScan
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Vehicle, getVehicleDisplayName, formatMileage } from '../models/Vehicle';

// Import SVG icon
import CarIcon from '../assets/icons/car.svg';

interface VehicleCardProps {
  vehicle: Vehicle;
  onPress?: () => void;
  showMileage?: boolean;
  showVin?: boolean;
  showLastScanned?: boolean;
  compact?: boolean;
  selected?: boolean;
  style?: ViewStyle;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  onPress,
  showMileage = true,
  showVin = false,
  showLastScanned = false,
  compact = false,
  selected = false,
  style,
}) => {
  const Container = onPress ? TouchableOpacity : View;

  const formatDate = (date?: Date): string => {
    if (!date) return 'Never';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Container
      style={[
        styles.container,
        compact && styles.containerCompact,
        selected && styles.containerSelected,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Vehicle Icon */}
      <View style={[styles.iconContainer, selected && styles.iconContainerSelected]}>
        <CarIcon 
          width={24} 
          height={24} 
          color={selected ? colors.text.inverse : colors.primary.red} 
        />
      </View>

      {/* Vehicle Info */}
      <View style={styles.infoContainer}>
        <Text style={[styles.vehicleName, compact && styles.vehicleNameCompact]} numberOfLines={1}>
          {vehicle.nickname || getVehicleDisplayName(vehicle)}
        </Text>
        
        {vehicle.nickname && (
          <Text style={styles.vehicleSubtitle} numberOfLines={1}>
            {getVehicleDisplayName(vehicle)}
          </Text>
        )}

        {showVin && (
          <Text style={styles.vinText} numberOfLines={1}>
            VIN: {vehicle.vin}
          </Text>
        )}

        <View style={styles.detailsRow}>
          {showMileage && (
            <Text style={styles.detailText}>
              {formatMileage(vehicle.mileage)}
            </Text>
          )}
          {showLastScanned && vehicle.lastScanned && (
            <>
              {showMileage && <Text style={styles.separator}>•</Text>}
              <Text style={styles.detailText}>
                Last scan: {formatDate(vehicle.lastScanned)}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Arrow indicator */}
      {onPress && (
        <View style={styles.arrowContainer}>
          <Text style={styles.arrow}>›</Text>
        </View>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.cardRadius,
    padding: spacing.cardPadding,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  containerCompact: {
    padding: spacing.md,
  },
  containerSelected: {
    borderColor: colors.primary.navy,
    borderWidth: 2,
    backgroundColor: '#F0F4F8',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.status.errorLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  iconContainerSelected: {
    backgroundColor: colors.primary.navy,
  },
  infoContainer: {
    flex: 1,
  },
  vehicleName: {
    ...typography.styles.h4,
    color: colors.text.primary,
  },
  vehicleNameCompact: {
    fontSize: typography.fontSize.md,
  },
  vehicleSubtitle: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    marginTop: 2,
  },
  vinText: {
    ...typography.styles.caption,
    color: colors.text.muted,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  detailText: {
    ...typography.styles.caption,
    color: colors.text.muted,
  },
  separator: {
    color: colors.text.light,
    marginHorizontal: spacing.xs,
  },
  arrowContainer: {
    justifyContent: 'center',
    paddingLeft: spacing.sm,
  },
  arrow: {
    fontSize: 24,
    color: colors.text.light,
    fontWeight: '300',
  },
});
