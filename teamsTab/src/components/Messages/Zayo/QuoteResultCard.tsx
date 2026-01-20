import {
  Card,
  makeStyles,
  Text,
  tokens,
  Divider,
} from '@fluentui/react-components';
import {
  Timer24Regular,
  DocumentText24Regular,
} from '@fluentui/react-icons';
import EmptyState from '../EmptyState';

const useStyles = makeStyles({
  card: {
    width: '100%',
    padding: '16px',
    margin: '10px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
  },
  titleGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  title: {
    fontSize: '16px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  subTitle: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground2,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  grid: {
    display: 'grid',
    gap: '16px',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  detailLabel: {
    fontSize: '11px',
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorNeutralForeground2,
  },
  detailValue: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
  termCard: {
    padding: '12px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: '8px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  termHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  termTitle: {
    fontSize: '14px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
  },
  priceGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  mrcText: {
    fontSize: '16px',
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
  },
  nrcText: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
});

interface FinancialTerm {
  term: string;
  totalMrc: number;
  totalNrc: number;
}

interface QuoteData {
  quoteNumber: string;
  quoteId: string;
  productCode: string; // "IP-DIA"
  bandwidth: string; // "10G"
  currencyIsoCode: string;
  estimatedInstallInterval: string;
  financialTerms: FinancialTerm[];
  configuration: {
    children: Array<{
      productCode: string;
      portHandoffSpeed?: string;
      handoff?: string;
    }>;
    ddosProtection?: {
      ddosProtectionIncluded: boolean;
    };
    locations: Array<{
      accessAddress?: string;
      address?: string;
      buildingNetworkStatus?: string;
      locationNetworkStatus?: string;
    }>;
  };
}

interface QuoteResultCardProps {
  data: {
    apiVersion: string;
    data: QuoteData;
  };
}

const QuoteResultCard: React.FC<QuoteResultCardProps> = ({ data }) => {
  const styles = useStyles();
  const quote = data?.data;

  if (!quote) return <EmptyState message="No quote details available." icon={<DocumentText24Regular />} />;

  const mainConfig = quote.configuration.children[0] || {};
  const location = quote.configuration.locations[0] || {};

  return (
    <Card className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <Text className={styles.title}>
            {mainConfig.productCode || 'Service'} Quote
          </Text>
          <Text className={styles.subTitle}>#{quote.quoteNumber}</Text>
        </div>
        <Badge 
          appearance="outline" 
          color="success" 
          icon={<Timer24Regular />}
        >
          {quote.estimatedInstallInterval} Install
        </Badge>
      </div>

      <Divider />

      {/* Service Details */}
      <div className={styles.section}>
        <Text className={styles.sectionTitle}>Service Configuration</Text>
        <div className={styles.grid}>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Bandwidth</Text>
            <Text className={styles.detailValue}>{quote.bandwidth}</Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Port Speed</Text>
            <Text className={styles.detailValue}>
              {mainConfig.portHandoffSpeed || 'N/A'}
            </Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Handoff Type</Text>
            <Text className={styles.detailValue}>
              {mainConfig.handoff || 'N/A'}
            </Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Location</Text>
            <Text className={styles.detailValue}>
              {location.address || 'Unknown Address'}
            </Text>
            <Text style={{ fontSize: '11px', color: tokens.colorPaletteGreenForeground1 }}>
              {location.locationNetworkStatus || location.buildingNetworkStatus}
            </Text>
          </div>
        </div>
      </div>

      <Divider />

      {/* Pricing Terms */}
      <div className={styles.section}>
        <Text className={styles.sectionTitle}>Pricing Terms (USD)</Text>
        <div className={styles.grid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
          {quote.financialTerms.map((term) => (
            <div key={term.term} className={styles.termCard}>
              <div className={styles.termHeader}>
                <Text className={styles.termTitle}>{term.term} Months</Text>
              </div>
              <div className={styles.priceGroup}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <Text className={styles.mrcText}>${term.totalMrc.toLocaleString()}</Text>
                  <Text style={{ fontSize: '10px', color: tokens.colorNeutralForeground3 }}>Monthly</Text>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: '12px', fontWeight: '600' }}>${term.totalNrc.toLocaleString()}</Text>
                  <Text style={{ fontSize: '10px', color: tokens.colorNeutralForeground3 }}>One-time</Text>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

// Add Badge component manually since it might be missing in imports or implementation
const Badge = ({ children, appearance, color, icon, style }: any) => {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: color === 'success' ? '#dcfce7' : '#f3f4f6',
        color: color === 'success' ? '#166534' : '#374151',
        border: appearance === 'outline' ? '1px solid currentColor' : 'none',
        ...style,
      }}
    >
      {icon && <span style={{ width: '16px', height: '16px', display: 'flex' }}>{icon}</span>}
      {children}
    </div>
  );
};

export default QuoteResultCard;
