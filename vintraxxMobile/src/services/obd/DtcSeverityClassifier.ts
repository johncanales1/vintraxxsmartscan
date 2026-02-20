// DTC Severity Classifier for VinTraxx SmartScan
// Classifies diagnostic trouble codes by severity based on code patterns and known issues

import { DtcSeverity } from '../../models/DtcCode';

export class DtcSeverityClassifier {
  private static instance: DtcSeverityClassifier;

  private constructor() {}

  static getInstance(): DtcSeverityClassifier {
    if (!DtcSeverityClassifier.instance) {
      DtcSeverityClassifier.instance = new DtcSeverityClassifier();
    }
    return DtcSeverityClassifier.instance;
  }

  /**
   * Classify DTC severity based on code and type
   */
  classifySeverity(code: string, description?: string): DtcSeverity {
    const codeUpper = code.toUpperCase();
    
    // Critical codes - immediate attention required
    if (this.isCriticalCode(codeUpper)) {
      return 'critical';
    }
    
    // Warning codes - should be addressed soon
    if (this.isWarningCode(codeUpper)) {
      return 'warning';
    }
    
    // Info codes - monitor but not urgent
    return 'info';
  }

  /**
   * Check if code is critical severity
   */
  private isCriticalCode(code: string): boolean {
    // Critical powertrain codes
    const criticalPatterns = [
      // Engine misfire codes
      /^P030[0-9]/,  // P0300-P0309 - Cylinder misfires
      /^P031[0-9]/,  // P0310-P0319 - Ignition coil issues
      
      // Transmission critical
      /^P070[0-9]/,  // P0700-P0709 - Transmission control system
      /^P073[0-9]/,  // P0730-P0739 - Gear ratio errors
      
      // Engine critical failures
      /^P0201/,      // Injector circuit malfunction
      /^P0202/,
      /^P0203/,
      /^P0204/,
      /^P0205/,
      /^P0206/,
      /^P0207/,
      /^P0208/,
      
      // Sensor critical failures
      /^P0335/,      // Crankshaft position sensor
      /^P0340/,      // Camshaft position sensor
      
      // Safety-critical chassis codes
      /^C0035/,      // Wheel speed sensor
      /^C0040/,
      /^C0045/,
      /^C0050/,
      
      // Airbag codes
      /^B000[1-9]/,  // Airbag circuit issues
      
      // Critical network codes
      /^U0100/,      // Lost communication with ECM/PCM
      /^U0101/,      // Lost communication with TCM
    ];

    return criticalPatterns.some(pattern => pattern.test(code));
  }

  /**
   * Check if code is warning severity
   */
  private isWarningCode(code: string): boolean {
    // Warning powertrain codes
    const warningPatterns = [
      // Fuel system
      /^P017[0-9]/,  // P0170-P0179 - Fuel trim issues
      
      // Emissions
      /^P042[0-9]/,  // P0420-P0429 - Catalyst efficiency
      /^P043[0-9]/,  // P0430-P0439 - Catalyst efficiency bank 2
      /^P044[0-9]/,  // P0440-P0449 - EVAP system
      /^P045[0-9]/,  // P0450-P0459 - EVAP system
      
      // Oxygen sensors
      /^P013[0-9]/,  // P0130-P0139 - O2 sensor bank 1
      /^P015[0-9]/,  // P0150-P0159 - O2 sensor bank 2
      
      // MAF/MAP sensors
      /^P010[0-9]/,  // P0100-P0109 - MAF circuit
      /^P011[0-9]/,  // P0110-P0119 - IAT sensor
      
      // Throttle position
      /^P012[0-9]/,  // P0120-P0129 - TPS circuit
      
      // Idle control
      /^P050[0-9]/,  // P0500-P0509 - Vehicle speed, idle control
      
      // Transmission warnings
      /^P071[0-9]/,  // P0710-P0719 - Transmission temp sensor
      /^P072[0-9]/,  // P0720-P0729 - Output speed sensor
      
      // Most C-codes (chassis) are warnings unless critical
      /^C[0-9]{4}$/,
      
      // Most B-codes (body) are warnings
      /^B[0-9]{4}$/,
    ];

    return warningPatterns.some(pattern => pattern.test(code));
  }
}

export const dtcSeverityClassifier = DtcSeverityClassifier.getInstance();
