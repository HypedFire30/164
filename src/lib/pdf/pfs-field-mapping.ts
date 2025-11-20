/**
 * PFS PDF Field Mapping Configuration
 * 
 * Maps all 262 PDF form fields to PFS data structure
 */

export interface PFSFieldMapping {
  pdfFieldName: string;
  dataSource: 'direct' | 'calculated' | 'schedule' | 'property';
  dataPath?: string; // For direct mappings
  scheduleType?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I';
  scheduleIndex?: number; // For schedule entries
  scheduleField?: string; // Field name within schedule
  propertyIndex?: number; // For Schedule F properties
  propertyField?: string; // Field name within property
  fieldType: 'text' | 'number' | 'date' | 'currency' | 'percentage';
  transform?: (value: any) => string;
  calculate?: (data: any) => number | string; // For calculated fields
}

/**
 * Complete field mapping configuration
 */
export const PFS_FIELD_MAPPINGS: PFSFieldMapping[] = [
  // ============================================================================
  // PAGE 1 - TOP SECTION
  // ============================================================================
  {
    pdfFieldName: 'TextField',
    dataSource: 'direct',
    dataPath: 'borrowerName',
    fieldType: 'text',
  },

  // ============================================================================
  // ASSETS SECTION
  // ============================================================================
  {
    pdfFieldName: 'TextField_1',
    dataSource: 'direct',
    dataPath: 'cashOnHand',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_3',
    dataSource: 'direct',
    dataPath: 'cashOtherInstitutions',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_5',
    dataSource: 'calculated',
    calculate: (data) => {
      // Schedule A total
      return data.scheduleA?.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0;
    },
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_7',
    dataSource: 'calculated',
    calculate: (data) => {
      // Schedule B total
      return data.scheduleB?.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0;
    },
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_9',
    dataSource: 'direct',
    dataPath: 'buildingMaterialInventory',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_11',
    dataSource: 'calculated',
    calculate: (data) => {
      // Schedule C total
      return data.scheduleC?.reduce((sum: number, item: any) => sum + (item.totalValue || 0), 0) || 0;
    },
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_13',
    dataSource: 'direct',
    dataPath: 'lifeInsuranceCashValue',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_15',
    dataSource: 'direct',
    dataPath: 'retirementAccounts',
    fieldType: 'currency',
  },
  // TextField_17 and TextField_18 - LEAVE BLANK (not used)
  {
    pdfFieldName: 'TextField_20',
    dataSource: 'calculated',
    calculate: (data) => {
      // Total Current Assets
      const cashOnHand = data.cashOnHand || 0;
      const cashOther = data.cashOtherInstitutions || 0;
      const scheduleA = data.scheduleA?.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0;
      const scheduleB = data.scheduleB?.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0;
      const inventory = data.buildingMaterialInventory || 0;
      const scheduleC = data.scheduleC?.reduce((sum: number, item: any) => sum + (item.totalValue || 0), 0) || 0;
      const lifeInsurance = data.lifeInsuranceCashValue || 0;
      const retirement = data.retirementAccounts || 0;
      return cashOnHand + cashOther + scheduleA + scheduleB + inventory + scheduleC + lifeInsurance + retirement;
    },
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_22',
    dataSource: 'calculated',
    calculate: (data) => {
      // Real Estate - Schedule F total (current value)
      return data.selectedProperties?.reduce((sum: number, prop: any) => {
        return sum + ((prop.currentValue || 0) * ((prop.ownershipPercentage || 0) / 100));
      }, 0) || 0;
    },
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_24',
    dataSource: 'direct',
    dataPath: 'automobilesTrucks',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_26',
    dataSource: 'direct',
    dataPath: 'machineryTools',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_27',
    dataSource: 'calculated',
    calculate: (data) => {
      // Schedule E total (present balance)
      return data.scheduleE?.reduce((sum: number, item: any) => sum + (item.presentBalance || 0), 0) || 0;
    },
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_30',
    dataSource: 'calculated',
    calculate: (data) => {
      // Schedule D total
      return data.scheduleD?.reduce((sum: number, item: any) => sum + (item.totalValue || 0), 0) || 0;
    },
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_33',
    dataSource: 'direct',
    dataPath: 'otherAssetsValue',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_36',
    dataSource: 'direct',
    dataPath: 'otherAssets',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_37',
    dataSource: 'direct',
    dataPath: 'otherAssetsValue',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_40',
    dataSource: 'calculated',
    calculate: (data) => {
      // Total Assets - use summaries if available
      return data.summaries?.totalAssets || 0;
    },
    fieldType: 'currency',
  },

  // ============================================================================
  // LIABILITIES SECTION
  // ============================================================================
  {
    pdfFieldName: 'TextField_2',
    dataSource: 'calculated',
    calculate: (data) => {
      // Schedule G total
      return data.scheduleG?.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0;
    },
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_4',
    dataSource: 'direct',
    dataPath: 'notesPayableRelatives',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_6',
    dataSource: 'calculated',
    calculate: (data) => {
      // Schedule H total
      return data.scheduleH?.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0;
    },
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_8',
    dataSource: 'calculated',
    calculate: (data) => {
      // Accrued Current Liabilities total
      const interest = data.accruedInterest || 0;
      const salary = data.accruedSalaryWages || 0;
      const taxes = data.accruedTaxesOther || 0;
      const incomeTax = data.incomeTaxPayable || 0;
      return interest + salary + taxes + incomeTax;
    },
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_10',
    dataSource: 'direct',
    dataPath: 'accruedInterest',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_12',
    dataSource: 'direct',
    dataPath: 'accruedSalaryWages',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_14',
    dataSource: 'direct',
    dataPath: 'accruedTaxesOther',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_16',
    dataSource: 'direct',
    dataPath: 'incomeTaxPayable',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_19',
    dataSource: 'calculated',
    calculate: (data) => {
      // Schedule I total
      return data.scheduleI?.reduce((sum: number, item: any) => sum + (item.balance || 0), 0) || 0;
    },
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_21',
    dataSource: 'calculated',
    calculate: (data) => {
      // Total Current Liabilities
      const scheduleG = data.scheduleG?.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0;
      const notesRelatives = data.notesPayableRelatives || 0;
      const scheduleH = data.scheduleH?.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0;
      const accrued = (data.accruedInterest || 0) + (data.accruedSalaryWages || 0) + 
                     (data.accruedTaxesOther || 0) + (data.incomeTaxPayable || 0);
      const scheduleI = data.scheduleI?.reduce((sum: number, item: any) => sum + (item.balance || 0), 0) || 0;
      return scheduleG + notesRelatives + scheduleH + accrued + scheduleI;
    },
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_23',
    dataSource: 'calculated',
    calculate: (data) => {
      // Real Estate Mortgages - Schedule F total (balance)
      return data.selectedProperties?.reduce((sum: number, prop: any) => {
        const mortgage = data.mortgages?.find((m: any) => m.propertyId === prop.id);
        return sum + (mortgage?.principalBalance || 0);
      }, 0) || 0;
    },
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_25',
    dataSource: 'direct',
    dataPath: 'chattelMortgage',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_28',
    dataSource: 'direct',
    dataPath: 'otherLiabilities',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_29',
    dataSource: 'direct',
    dataPath: 'otherLiabilitiesValue',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_31',
    dataSource: 'direct',
    dataPath: 'otherLiabilities',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_32',
    dataSource: 'direct',
    dataPath: 'otherLiabilitiesValue',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_34',
    dataSource: 'direct',
    dataPath: 'otherLiabilities',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_35',
    dataSource: 'direct',
    dataPath: 'otherLiabilitiesValue',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_38',
    dataSource: 'direct',
    dataPath: 'otherLiabilities',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_39',
    dataSource: 'direct',
    dataPath: 'otherLiabilitiesValue',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_41',
    dataSource: 'calculated',
    calculate: (data) => {
      // Total Liabilities - use summaries if available
      return data.summaries?.totalLiabilities || 0;
    },
    fieldType: 'currency',
  },

  // ============================================================================
  // INCOME SECTION
  // ============================================================================
  {
    pdfFieldName: 'TextField_42',
    dataSource: 'calculated',
    calculate: (data) => {
      // Income for Year to Date (total)
      const salary = data.salaryWages || 0;
      const draws = data.proprietorshipDraws || 0;
      const commissions = data.commissionsBonus || 0;
      const dividends = data.dividendsInterest || 0;
      const rentals = data.rentals || 0;
      const other = data.otherIncome || 0;
      return salary + draws + commissions + dividends + rentals + other;
    },
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_44',
    dataSource: 'direct',
    dataPath: 'salaryWages',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_46',
    dataSource: 'direct',
    dataPath: 'proprietorshipDraws',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_48',
    dataSource: 'direct',
    dataPath: 'commissionsBonus',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_51',
    dataSource: 'direct',
    dataPath: 'dividendsInterest',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_54',
    dataSource: 'direct',
    dataPath: 'rentals',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_56',
    dataSource: 'direct',
    dataPath: 'otherIncome',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_58',
    dataSource: 'direct',
    dataPath: 'otherIncome',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_59',
    dataSource: 'direct',
    dataPath: 'otherIncome',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_61',
    dataSource: 'calculated',
    calculate: (data) => {
      // Total Net Income
      const salary = data.salaryWages || 0;
      const draws = data.proprietorshipDraws || 0;
      const commissions = data.commissionsBonus || 0;
      const dividends = data.dividendsInterest || 0;
      const rentals = data.rentals || 0;
      const other = data.otherIncome || 0;
      return salary + draws + commissions + dividends + rentals + other;
    },
    fieldType: 'currency',
  },

  // ============================================================================
  // CONTINGENT LIABILITIES & INSURANCE
  // ============================================================================
  {
    pdfFieldName: 'TextField_43',
    dataSource: 'calculated',
    calculate: (data) => {
      // Contingent Liabilities total
      const guaranteed = data.guaranteedLoans || 0;
      const surety = data.suretyBonds || 0;
      const other = data.contingentOtherValue || 0;
      return guaranteed + surety + other;
    },
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_45',
    dataSource: 'direct',
    dataPath: 'guaranteedLoans',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_47',
    dataSource: 'direct',
    dataPath: 'suretyBonds',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_49',
    dataSource: 'direct',
    dataPath: 'contingentOther',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_50',
    dataSource: 'direct',
    dataPath: 'contingentOtherValue',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_52',
    dataSource: 'direct',
    dataPath: 'insuranceDescription',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_53',
    dataSource: 'direct',
    dataPath: 'insuranceAmount',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_55',
    dataSource: 'direct',
    dataPath: 'lifeInsuranceFaceValue',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_57',
    dataSource: 'direct',
    dataPath: 'lifeInsuranceCashValue',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_60',
    dataSource: 'direct',
    dataPath: 'lifeInsuranceBorrowed',
    fieldType: 'currency',
  },

  // ============================================================================
  // SCHEDULE A - Accounts Receivable (3 rows)
  // ============================================================================
  {
    pdfFieldName: 'TextField_62',
    dataSource: 'schedule',
    scheduleType: 'A',
    scheduleIndex: 0,
    scheduleField: 'name',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_63',
    dataSource: 'schedule',
    scheduleType: 'A',
    scheduleIndex: 0,
    scheduleField: 'amount',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_64',
    dataSource: 'schedule',
    scheduleType: 'A',
    scheduleIndex: 0,
    scheduleField: 'dueDate',
    fieldType: 'date',
  },
  {
    pdfFieldName: 'TextField_68',
    dataSource: 'schedule',
    scheduleType: 'A',
    scheduleIndex: 1,
    scheduleField: 'name',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_69',
    dataSource: 'schedule',
    scheduleType: 'A',
    scheduleIndex: 1,
    scheduleField: 'amount',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_70',
    dataSource: 'schedule',
    scheduleType: 'A',
    scheduleIndex: 1,
    scheduleField: 'dueDate',
    fieldType: 'date',
  },
  {
    pdfFieldName: 'TextField_74',
    dataSource: 'schedule',
    scheduleType: 'A',
    scheduleIndex: 2,
    scheduleField: 'name',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_75',
    dataSource: 'schedule',
    scheduleType: 'A',
    scheduleIndex: 2,
    scheduleField: 'amount',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_76',
    dataSource: 'schedule',
    scheduleType: 'A',
    scheduleIndex: 2,
    scheduleField: 'dueDate',
    fieldType: 'date',
  },
  {
    pdfFieldName: 'TextField_80',
    dataSource: 'calculated',
    calculate: (data) => {
      // Schedule A total
      return data.scheduleA?.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0;
    },
    fieldType: 'currency',
  },

  // ============================================================================
  // SCHEDULE B - Notes Receivable (3 rows)
  // ============================================================================
  {
    pdfFieldName: 'TextField_65',
    dataSource: 'schedule',
    scheduleType: 'B',
    scheduleIndex: 0,
    scheduleField: 'name',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_66',
    dataSource: 'schedule',
    scheduleType: 'B',
    scheduleIndex: 0,
    scheduleField: 'amount',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_67',
    dataSource: 'schedule',
    scheduleType: 'B',
    scheduleIndex: 0,
    scheduleField: 'dueDate',
    fieldType: 'date',
  },
  {
    pdfFieldName: 'TextField_71',
    dataSource: 'schedule',
    scheduleType: 'B',
    scheduleIndex: 1,
    scheduleField: 'name',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_72',
    dataSource: 'schedule',
    scheduleType: 'B',
    scheduleIndex: 1,
    scheduleField: 'amount',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_73',
    dataSource: 'schedule',
    scheduleType: 'B',
    scheduleIndex: 1,
    scheduleField: 'dueDate',
    fieldType: 'date',
  },
  {
    pdfFieldName: 'TextField_77',
    dataSource: 'schedule',
    scheduleType: 'B',
    scheduleIndex: 2,
    scheduleField: 'name',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_78',
    dataSource: 'schedule',
    scheduleType: 'B',
    scheduleIndex: 2,
    scheduleField: 'amount',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_79',
    dataSource: 'schedule',
    scheduleType: 'B',
    scheduleIndex: 2,
    scheduleField: 'dueDate',
    fieldType: 'date',
  },
  {
    pdfFieldName: 'TextField_81',
    dataSource: 'calculated',
    calculate: (data) => {
      // Schedule B total
      return data.scheduleB?.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0;
    },
    fieldType: 'currency',
  },

  // ============================================================================
  // SCHEDULE C - Listed Stocks and Bonds (3 rows)
  // ============================================================================
  {
    pdfFieldName: 'TextField_82',
    dataSource: 'schedule',
    scheduleType: 'C',
    scheduleIndex: 0,
    scheduleField: 'registeredName',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_83',
    dataSource: 'schedule',
    scheduleType: 'C',
    scheduleIndex: 0,
    scheduleField: 'registeredName',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_84',
    dataSource: 'schedule',
    scheduleType: 'C',
    scheduleIndex: 0,
    scheduleField: 'shares',
    fieldType: 'number',
  },
  {
    pdfFieldName: 'TextField_85',
    dataSource: 'schedule',
    scheduleType: 'C',
    scheduleIndex: 0,
    scheduleField: 'marketPerShare',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_86',
    dataSource: 'schedule',
    scheduleType: 'C',
    scheduleIndex: 0,
    scheduleField: 'totalValue',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_87',
    dataSource: 'schedule',
    scheduleType: 'C',
    scheduleIndex: 1,
    scheduleField: 'registeredName',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_88',
    dataSource: 'schedule',
    scheduleType: 'C',
    scheduleIndex: 1,
    scheduleField: 'registeredName',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_89',
    dataSource: 'schedule',
    scheduleType: 'C',
    scheduleIndex: 1,
    scheduleField: 'shares',
    fieldType: 'number',
  },
  {
    pdfFieldName: 'TextField_90',
    dataSource: 'schedule',
    scheduleType: 'C',
    scheduleIndex: 1,
    scheduleField: 'marketPerShare',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_91',
    dataSource: 'schedule',
    scheduleType: 'C',
    scheduleIndex: 1,
    scheduleField: 'totalValue',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_92',
    dataSource: 'schedule',
    scheduleType: 'C',
    scheduleIndex: 2,
    scheduleField: 'registeredName',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_93',
    dataSource: 'schedule',
    scheduleType: 'C',
    scheduleIndex: 2,
    scheduleField: 'registeredName',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_94',
    dataSource: 'schedule',
    scheduleType: 'C',
    scheduleIndex: 2,
    scheduleField: 'shares',
    fieldType: 'number',
  },
  {
    pdfFieldName: 'TextField_95',
    dataSource: 'schedule',
    scheduleType: 'C',
    scheduleIndex: 2,
    scheduleField: 'marketPerShare',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_96',
    dataSource: 'schedule',
    scheduleType: 'C',
    scheduleIndex: 2,
    scheduleField: 'totalValue',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_97',
    dataSource: 'calculated',
    calculate: (data) => {
      // Schedule C total
      return data.scheduleC?.reduce((sum: number, item: any) => sum + (item.totalValue || 0), 0) || 0;
    },
    fieldType: 'currency',
  },

  // ============================================================================
  // SCHEDULE D - Unlisted Stocks and Bonds (3 rows)
  // ============================================================================
  {
    pdfFieldName: 'TextField_98',
    dataSource: 'schedule',
    scheduleType: 'D',
    scheduleIndex: 0,
    scheduleField: 'registeredName',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_99',
    dataSource: 'schedule',
    scheduleType: 'D',
    scheduleIndex: 0,
    scheduleField: 'shares',
    fieldType: 'number',
  },
  {
    pdfFieldName: 'TextField_100',
    dataSource: 'schedule',
    scheduleType: 'D',
    scheduleIndex: 0,
    scheduleField: 'marketPerShare',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_101',
    dataSource: 'schedule',
    scheduleType: 'D',
    scheduleIndex: 0,
    scheduleField: 'totalValue',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_102',
    dataSource: 'schedule',
    scheduleType: 'D',
    scheduleIndex: 1,
    scheduleField: 'registeredName',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_103',
    dataSource: 'schedule',
    scheduleType: 'D',
    scheduleIndex: 1,
    scheduleField: 'shares',
    fieldType: 'number',
  },
  {
    pdfFieldName: 'TextField_104',
    dataSource: 'schedule',
    scheduleType: 'D',
    scheduleIndex: 1,
    scheduleField: 'marketPerShare',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_105',
    dataSource: 'schedule',
    scheduleType: 'D',
    scheduleIndex: 1,
    scheduleField: 'totalValue',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_106',
    dataSource: 'schedule',
    scheduleType: 'D',
    scheduleIndex: 2,
    scheduleField: 'registeredName',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_107',
    dataSource: 'schedule',
    scheduleType: 'D',
    scheduleIndex: 2,
    scheduleField: 'shares',
    fieldType: 'number',
  },
  {
    pdfFieldName: 'TextField_108',
    dataSource: 'schedule',
    scheduleType: 'D',
    scheduleIndex: 2,
    scheduleField: 'marketPerShare',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_109',
    dataSource: 'schedule',
    scheduleType: 'D',
    scheduleIndex: 2,
    scheduleField: 'totalValue',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_110',
    dataSource: 'calculated',
    calculate: (data) => {
      // Schedule D total
      return data.scheduleD?.reduce((sum: number, item: any) => sum + (item.totalValue || 0), 0) || 0;
    },
    fieldType: 'currency',
  },

  // ============================================================================
  // PAGE 2 - SCHEDULE E - Contracts and Mortgages Receivable (3 rows)
  // ============================================================================
  {
    pdfFieldName: 'TextField_111',
    dataSource: 'schedule',
    scheduleType: 'E',
    scheduleIndex: 0,
    scheduleField: 'description',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_112',
    dataSource: 'schedule',
    scheduleType: 'E',
    scheduleIndex: 0,
    scheduleField: 'debtorName',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_113',
    dataSource: 'schedule',
    scheduleType: 'E',
    scheduleIndex: 0,
    scheduleField: 'paymentSchedule',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_114',
    dataSource: 'schedule',
    scheduleType: 'E',
    scheduleIndex: 0,
    scheduleField: 'pastDue',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_115',
    dataSource: 'schedule',
    scheduleType: 'E',
    scheduleIndex: 0,
    scheduleField: 'originalBalance',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_116',
    dataSource: 'schedule',
    scheduleType: 'E',
    scheduleIndex: 0,
    scheduleField: 'presentBalance',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_117',
    dataSource: 'schedule',
    scheduleType: 'E',
    scheduleIndex: 0,
    scheduleField: 'interestRate',
    fieldType: 'percentage',
  },
  {
    pdfFieldName: 'TextField_118',
    dataSource: 'schedule',
    scheduleType: 'E',
    scheduleIndex: 1,
    scheduleField: 'description',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_119',
    dataSource: 'schedule',
    scheduleType: 'E',
    scheduleIndex: 1,
    scheduleField: 'debtorName',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_120',
    dataSource: 'schedule',
    scheduleType: 'E',
    scheduleIndex: 1,
    scheduleField: 'paymentSchedule',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_121',
    dataSource: 'schedule',
    scheduleType: 'E',
    scheduleIndex: 1,
    scheduleField: 'pastDue',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_122',
    dataSource: 'schedule',
    scheduleType: 'E',
    scheduleIndex: 1,
    scheduleField: 'originalBalance',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_123',
    dataSource: 'schedule',
    scheduleType: 'E',
    scheduleIndex: 1,
    scheduleField: 'presentBalance',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_124',
    dataSource: 'schedule',
    scheduleType: 'E',
    scheduleIndex: 1,
    scheduleField: 'interestRate',
    fieldType: 'percentage',
  },
  {
    pdfFieldName: 'TextField_125',
    dataSource: 'schedule',
    scheduleType: 'E',
    scheduleIndex: 2,
    scheduleField: 'description',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_126',
    dataSource: 'schedule',
    scheduleType: 'E',
    scheduleIndex: 2,
    scheduleField: 'debtorName',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_127',
    dataSource: 'schedule',
    scheduleType: 'E',
    scheduleIndex: 2,
    scheduleField: 'paymentSchedule',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_128',
    dataSource: 'schedule',
    scheduleType: 'E',
    scheduleIndex: 2,
    scheduleField: 'pastDue',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_129',
    dataSource: 'schedule',
    scheduleType: 'E',
    scheduleIndex: 2,
    scheduleField: 'originalBalance',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_130',
    dataSource: 'schedule',
    scheduleType: 'E',
    scheduleIndex: 2,
    scheduleField: 'presentBalance',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_131',
    dataSource: 'schedule',
    scheduleType: 'E',
    scheduleIndex: 2,
    scheduleField: 'interestRate',
    fieldType: 'percentage',
  },
  {
    pdfFieldName: 'TextField_132',
    dataSource: 'calculated',
    calculate: (data) => {
      // Schedule E - Amount Past Due Total (114 + 121 + 128)
      return data.scheduleE?.reduce((sum: number, item: any) => sum + (item.pastDue || 0), 0) || 0;
    },
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_133',
    dataSource: 'calculated',
    calculate: (data) => {
      // Schedule E - Present Balance Total (116 + 123 + 130)
      return data.scheduleE?.reduce((sum: number, item: any) => sum + (item.presentBalance || 0), 0) || 0;
    },
    fieldType: 'currency',
  },

  // ============================================================================
  // SCHEDULE F - Real Estate (8 properties)
  // ============================================================================
  // Property 1
  {
    pdfFieldName: 'TextField_134',
    dataSource: 'property',
    propertyIndex: 0,
    propertyField: 'address',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_135',
    dataSource: 'property',
    propertyIndex: 0,
    propertyField: 'propertyType',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_136',
    dataSource: 'property',
    propertyIndex: 0,
    propertyField: 'yearAcquired',
    fieldType: 'date',
  },
  {
    pdfFieldName: 'TextField_137',
    dataSource: 'property',
    propertyIndex: 0,
    propertyField: 'originalCost',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_138',
    dataSource: 'property',
    propertyIndex: 0,
    propertyField: 'currentValue',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_139',
    dataSource: 'property',
    propertyIndex: 0,
    propertyField: 'lender',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_140',
    dataSource: 'property',
    propertyIndex: 0,
    propertyField: 'balance',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_141',
    dataSource: 'property',
    propertyIndex: 0,
    propertyField: 'payment',
    fieldType: 'currency',
  },
  // Property 2
  {
    pdfFieldName: 'TextField_142',
    dataSource: 'property',
    propertyIndex: 1,
    propertyField: 'address',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_143',
    dataSource: 'property',
    propertyIndex: 1,
    propertyField: 'propertyType',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_144',
    dataSource: 'property',
    propertyIndex: 1,
    propertyField: 'yearAcquired',
    fieldType: 'date',
  },
  {
    pdfFieldName: 'TextField_145',
    dataSource: 'property',
    propertyIndex: 1,
    propertyField: 'originalCost',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_146',
    dataSource: 'property',
    propertyIndex: 1,
    propertyField: 'currentValue',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_147',
    dataSource: 'property',
    propertyIndex: 1,
    propertyField: 'lender',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_148',
    dataSource: 'property',
    propertyIndex: 1,
    propertyField: 'balance',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_149',
    dataSource: 'property',
    propertyIndex: 1,
    propertyField: 'payment',
    fieldType: 'currency',
  },
  // Property 3
  {
    pdfFieldName: 'TextField_150',
    dataSource: 'property',
    propertyIndex: 2,
    propertyField: 'address',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_151',
    dataSource: 'property',
    propertyIndex: 2,
    propertyField: 'propertyType',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_152',
    dataSource: 'property',
    propertyIndex: 2,
    propertyField: 'yearAcquired',
    fieldType: 'date',
  },
  {
    pdfFieldName: 'TextField_153',
    dataSource: 'property',
    propertyIndex: 2,
    propertyField: 'originalCost',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_154',
    dataSource: 'property',
    propertyIndex: 2,
    propertyField: 'currentValue',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_155',
    dataSource: 'property',
    propertyIndex: 2,
    propertyField: 'lender',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_156',
    dataSource: 'property',
    propertyIndex: 2,
    propertyField: 'balance',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_157',
    dataSource: 'property',
    propertyIndex: 2,
    propertyField: 'payment',
    fieldType: 'currency',
  },
  // Property 4
  {
    pdfFieldName: 'TextField_158',
    dataSource: 'property',
    propertyIndex: 3,
    propertyField: 'address',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_159',
    dataSource: 'property',
    propertyIndex: 3,
    propertyField: 'propertyType',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_160',
    dataSource: 'property',
    propertyIndex: 3,
    propertyField: 'yearAcquired',
    fieldType: 'date',
  },
  {
    pdfFieldName: 'TextField_161',
    dataSource: 'property',
    propertyIndex: 3,
    propertyField: 'originalCost',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_162',
    dataSource: 'property',
    propertyIndex: 3,
    propertyField: 'currentValue',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_163',
    dataSource: 'property',
    propertyIndex: 3,
    propertyField: 'lender',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_164',
    dataSource: 'property',
    propertyIndex: 3,
    propertyField: 'balance',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_165',
    dataSource: 'property',
    propertyIndex: 3,
    propertyField: 'payment',
    fieldType: 'currency',
  },
  // Property 5
  {
    pdfFieldName: 'TextField_166',
    dataSource: 'property',
    propertyIndex: 4,
    propertyField: 'address',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_167',
    dataSource: 'property',
    propertyIndex: 4,
    propertyField: 'propertyType',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_168',
    dataSource: 'property',
    propertyIndex: 4,
    propertyField: 'yearAcquired',
    fieldType: 'date',
  },
  {
    pdfFieldName: 'TextField_169',
    dataSource: 'property',
    propertyIndex: 4,
    propertyField: 'originalCost',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_170',
    dataSource: 'property',
    propertyIndex: 4,
    propertyField: 'currentValue',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_171',
    dataSource: 'property',
    propertyIndex: 4,
    propertyField: 'lender',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_172',
    dataSource: 'property',
    propertyIndex: 4,
    propertyField: 'balance',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_173',
    dataSource: 'property',
    propertyIndex: 4,
    propertyField: 'payment',
    fieldType: 'currency',
  },
  // Property 6
  {
    pdfFieldName: 'TextField_174',
    dataSource: 'property',
    propertyIndex: 5,
    propertyField: 'address',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_175',
    dataSource: 'property',
    propertyIndex: 5,
    propertyField: 'propertyType',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_176',
    dataSource: 'property',
    propertyIndex: 5,
    propertyField: 'yearAcquired',
    fieldType: 'date',
  },
  {
    pdfFieldName: 'TextField_177',
    dataSource: 'property',
    propertyIndex: 5,
    propertyField: 'originalCost',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_178',
    dataSource: 'property',
    propertyIndex: 5,
    propertyField: 'currentValue',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_179',
    dataSource: 'property',
    propertyIndex: 5,
    propertyField: 'lender',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_180',
    dataSource: 'property',
    propertyIndex: 5,
    propertyField: 'balance',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_181',
    dataSource: 'property',
    propertyIndex: 5,
    propertyField: 'payment',
    fieldType: 'currency',
  },
  // Property 7
  {
    pdfFieldName: 'TextField_182',
    dataSource: 'property',
    propertyIndex: 6,
    propertyField: 'address',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_183',
    dataSource: 'property',
    propertyIndex: 6,
    propertyField: 'propertyType',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_184',
    dataSource: 'property',
    propertyIndex: 6,
    propertyField: 'yearAcquired',
    fieldType: 'date',
  },
  {
    pdfFieldName: 'TextField_185',
    dataSource: 'property',
    propertyIndex: 6,
    propertyField: 'originalCost',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_186',
    dataSource: 'property',
    propertyIndex: 6,
    propertyField: 'currentValue',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_187',
    dataSource: 'property',
    propertyIndex: 6,
    propertyField: 'lender',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_188',
    dataSource: 'property',
    propertyIndex: 6,
    propertyField: 'balance',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_189',
    dataSource: 'property',
    propertyIndex: 6,
    propertyField: 'payment',
    fieldType: 'currency',
  },
  // Property 8
  {
    pdfFieldName: 'TextField_190',
    dataSource: 'property',
    propertyIndex: 7,
    propertyField: 'address',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_191',
    dataSource: 'property',
    propertyIndex: 7,
    propertyField: 'propertyType',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_192',
    dataSource: 'property',
    propertyIndex: 7,
    propertyField: 'yearAcquired',
    fieldType: 'date',
  },
  {
    pdfFieldName: 'TextField_193',
    dataSource: 'property',
    propertyIndex: 7,
    propertyField: 'originalCost',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_194',
    dataSource: 'property',
    propertyIndex: 7,
    propertyField: 'currentValue',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_195',
    dataSource: 'property',
    propertyIndex: 7,
    propertyField: 'lender',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_196',
    dataSource: 'property',
    propertyIndex: 7,
    propertyField: 'balance',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_197',
    dataSource: 'property',
    propertyIndex: 7,
    propertyField: 'payment',
    fieldType: 'currency',
  },
  // Schedule F Totals
  {
    pdfFieldName: 'TextField_198',
    dataSource: 'calculated',
    calculate: (data) => {
      // Schedule F - Current Value Total
      return data.selectedProperties?.reduce((sum: number, prop: any) => {
        return sum + ((prop.currentValue || 0) * ((prop.ownershipPercentage || 0) / 100));
      }, 0) || 0;
    },
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_199',
    dataSource: 'calculated',
    calculate: (data) => {
      // Schedule F - Balance Total
      return data.selectedProperties?.reduce((sum: number, prop: any) => {
        const mortgage = data.mortgages?.find((m: any) => m.propertyId === prop.id);
        return sum + (mortgage?.principalBalance || 0);
      }, 0) || 0;
    },
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_200',
    dataSource: 'calculated',
    calculate: (data) => {
      // Schedule F - Payment Total (141 + 149 + 157 + 165 + 173 + 181 + 189 + 197)
      return data.selectedProperties?.reduce((sum: number, prop: any) => {
        const mortgage = data.mortgages?.find((m: any) => m.propertyId === prop.id);
        return sum + (mortgage?.paymentAmount || 0);
      }, 0) || 0;
    },
    fieldType: 'currency',
  },

  // ============================================================================
  // SCHEDULE G - Open Accounts Payable (3 rows)
  // ============================================================================
  {
    pdfFieldName: 'TextField_201',
    dataSource: 'schedule',
    scheduleType: 'G',
    scheduleIndex: 0,
    scheduleField: 'payableTo',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_202',
    dataSource: 'schedule',
    scheduleType: 'G',
    scheduleIndex: 0,
    scheduleField: 'amount',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_203',
    dataSource: 'schedule',
    scheduleType: 'G',
    scheduleIndex: 0,
    scheduleField: 'dueDate',
    fieldType: 'date',
  },
  {
    pdfFieldName: 'TextField_207',
    dataSource: 'schedule',
    scheduleType: 'G',
    scheduleIndex: 1,
    scheduleField: 'payableTo',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_208',
    dataSource: 'schedule',
    scheduleType: 'G',
    scheduleIndex: 1,
    scheduleField: 'amount',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_209',
    dataSource: 'schedule',
    scheduleType: 'G',
    scheduleIndex: 1,
    scheduleField: 'dueDate',
    fieldType: 'date',
  },
  {
    pdfFieldName: 'TextField_213',
    dataSource: 'schedule',
    scheduleType: 'G',
    scheduleIndex: 2,
    scheduleField: 'payableTo',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_214',
    dataSource: 'schedule',
    scheduleType: 'G',
    scheduleIndex: 2,
    scheduleField: 'amount',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_215',
    dataSource: 'schedule',
    scheduleType: 'G',
    scheduleIndex: 2,
    scheduleField: 'dueDate',
    fieldType: 'date',
  },
  {
    pdfFieldName: 'TextField_219',
    dataSource: 'calculated',
    calculate: (data) => {
      // Schedule G total
      return data.scheduleG?.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0;
    },
    fieldType: 'currency',
  },

  // ============================================================================
  // SCHEDULE H - Notes Payable to Others (3 rows)
  // ============================================================================
  {
    pdfFieldName: 'TextField_204',
    dataSource: 'schedule',
    scheduleType: 'H',
    scheduleIndex: 0,
    scheduleField: 'payableTo',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_205',
    dataSource: 'schedule',
    scheduleType: 'H',
    scheduleIndex: 0,
    scheduleField: 'amount',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_206',
    dataSource: 'schedule',
    scheduleType: 'H',
    scheduleIndex: 0,
    scheduleField: 'dueDate',
    fieldType: 'date',
  },
  {
    pdfFieldName: 'TextField_210',
    dataSource: 'schedule',
    scheduleType: 'H',
    scheduleIndex: 1,
    scheduleField: 'payableTo',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_211',
    dataSource: 'schedule',
    scheduleType: 'H',
    scheduleIndex: 1,
    scheduleField: 'amount',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_212',
    dataSource: 'schedule',
    scheduleType: 'H',
    scheduleIndex: 1,
    scheduleField: 'dueDate',
    fieldType: 'date',
  },
  {
    pdfFieldName: 'TextField_216',
    dataSource: 'schedule',
    scheduleType: 'H',
    scheduleIndex: 2,
    scheduleField: 'payableTo',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_217',
    dataSource: 'schedule',
    scheduleType: 'H',
    scheduleIndex: 2,
    scheduleField: 'amount',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_218',
    dataSource: 'schedule',
    scheduleType: 'H',
    scheduleIndex: 2,
    scheduleField: 'dueDate',
    fieldType: 'date',
  },
  {
    pdfFieldName: 'TextField_220',
    dataSource: 'calculated',
    calculate: (data) => {
      // Schedule H total
      return data.scheduleH?.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0;
    },
    fieldType: 'currency',
  },

  // ============================================================================
  // SCHEDULE I - Installment Obligations (8 rows)
  // ============================================================================
  // Row 1
  {
    pdfFieldName: 'TextField_221',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 0,
    scheduleField: 'payableTo',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_222',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 0,
    scheduleField: 'collateral',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_223',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 0,
    scheduleField: 'balance',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_224',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 0,
    scheduleField: 'finalDueDate',
    fieldType: 'date',
  },
  {
    pdfFieldName: 'TextField_225',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 0,
    scheduleField: 'monthlyPayment',
    fieldType: 'currency',
  },
  // Row 2
  {
    pdfFieldName: 'TextField_226',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 1,
    scheduleField: 'payableTo',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_227',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 1,
    scheduleField: 'collateral',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_228',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 1,
    scheduleField: 'balance',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_229',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 1,
    scheduleField: 'finalDueDate',
    fieldType: 'date',
  },
  {
    pdfFieldName: 'TextField_230',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 1,
    scheduleField: 'monthlyPayment',
    fieldType: 'currency',
  },
  // Row 3
  {
    pdfFieldName: 'TextField_231',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 2,
    scheduleField: 'payableTo',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_232',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 2,
    scheduleField: 'collateral',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_233',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 2,
    scheduleField: 'balance',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_234',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 2,
    scheduleField: 'finalDueDate',
    fieldType: 'date',
  },
  {
    pdfFieldName: 'TextField_235',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 2,
    scheduleField: 'monthlyPayment',
    fieldType: 'currency',
  },
  // Row 4
  {
    pdfFieldName: 'TextField_236',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 3,
    scheduleField: 'payableTo',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_237',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 3,
    scheduleField: 'collateral',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_238',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 3,
    scheduleField: 'balance',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_239',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 3,
    scheduleField: 'finalDueDate',
    fieldType: 'date',
  },
  {
    pdfFieldName: 'TextField_240',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 3,
    scheduleField: 'monthlyPayment',
    fieldType: 'currency',
  },
  // Row 5
  {
    pdfFieldName: 'TextField_241',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 4,
    scheduleField: 'payableTo',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_242',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 4,
    scheduleField: 'collateral',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_243',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 4,
    scheduleField: 'balance',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_244',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 4,
    scheduleField: 'finalDueDate',
    fieldType: 'date',
  },
  {
    pdfFieldName: 'TextField_245',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 4,
    scheduleField: 'monthlyPayment',
    fieldType: 'currency',
  },
  // Row 6
  {
    pdfFieldName: 'TextField_246',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 5,
    scheduleField: 'payableTo',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_247',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 5,
    scheduleField: 'collateral',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_248',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 5,
    scheduleField: 'balance',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_249',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 5,
    scheduleField: 'finalDueDate',
    fieldType: 'date',
  },
  {
    pdfFieldName: 'TextField_250',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 5,
    scheduleField: 'monthlyPayment',
    fieldType: 'currency',
  },
  // Row 7
  {
    pdfFieldName: 'TextField_251',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 6,
    scheduleField: 'payableTo',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_252',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 6,
    scheduleField: 'collateral',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_253',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 6,
    scheduleField: 'balance',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_254',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 6,
    scheduleField: 'finalDueDate',
    fieldType: 'date',
  },
  {
    pdfFieldName: 'TextField_255',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 6,
    scheduleField: 'monthlyPayment',
    fieldType: 'currency',
  },
  // Row 8
  {
    pdfFieldName: 'TextField_256',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 7,
    scheduleField: 'payableTo',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_257',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 7,
    scheduleField: 'collateral',
    fieldType: 'text',
  },
  {
    pdfFieldName: 'TextField_258',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 7,
    scheduleField: 'balance',
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_259',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 7,
    scheduleField: 'finalDueDate',
    fieldType: 'date',
  },
  {
    pdfFieldName: 'TextField_260',
    dataSource: 'schedule',
    scheduleType: 'I',
    scheduleIndex: 7,
    scheduleField: 'monthlyPayment',
    fieldType: 'currency',
  },
  // Schedule I Totals
  {
    pdfFieldName: 'TextField_261',
    dataSource: 'calculated',
    calculate: (data) => {
      // Schedule I - Balance Total
      return data.scheduleI?.reduce((sum: number, item: any) => sum + (item.balance || 0), 0) || 0;
    },
    fieldType: 'currency',
  },
  {
    pdfFieldName: 'TextField_262',
    dataSource: 'calculated',
    calculate: (data) => {
      // Schedule I - Monthly Payment Total
      return data.scheduleI?.reduce((sum: number, item: any) => sum + (item.monthlyPayment || 0), 0) || 0;
    },
    fieldType: 'currency',
  },
];

