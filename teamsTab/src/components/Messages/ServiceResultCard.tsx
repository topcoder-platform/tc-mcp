import React, { useState } from 'react';
import {
  Card,
  makeStyles,
  shorthands,
  Text,
  tokens,
  Badge,
} from '@fluentui/react-components';
import {
  ChevronDown16Regular,
  ChevronUp16Regular,
  BuildingMultiple20Regular,
} from '@fluentui/react-icons';
import EmptyState from './EmptyState';

const useStyles = makeStyles({
  card: {
    width: '100%',
    minWidth: 'auto',
    maxWidth: '960px',
    padding: 0,
    gap: 0,
    margin: '12px 0',
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  serviceItem: {
    display: 'flex',
    flexDirection: 'column',
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  serviceRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '12px',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  serviceHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  },
  serviceInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
    minWidth: 0,
    flexWrap: 'wrap',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  serviceName: {
    fontSize: '14px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  productPill: {
    fontSize: '11px',
    padding: '2px 8px',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    color: '#3b82f6',
    borderRadius: '8px',
    fontWeight: tokens.fontWeightMedium,
  },
  circuitId: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
    fontFamily: 'monospace',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '8px',
    '@media (max-width: 540px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  detailLabel: {
    fontSize: '10px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  detailValue: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground2,
  },
  locationsExpandedRow: {
    padding: '12px',
    paddingTop: 0,
    backgroundColor: tokens.colorNeutralBackground2,
    borderTop: `1px solid ${tokens.colorNeutralStroke3}`,
  },
  locationsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  locationsTitle: {
    fontSize: '10px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  locationItem: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground2,
    paddingLeft: '12px',
    position: 'relative',
    '&::before': {
      content: '"•"',
      position: 'absolute',
      left: 0,
    },
  },
  chevronIcon: {
    color: tokens.colorNeutralForeground3,
    transition: 'transform 0.2s ease',
  },
  footer: {
    ...shorthands.padding('0', '8px'),
    display: 'flex',
    justifyContent: 'end',
    alignItems: 'center',
  },
  footerText: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--colorBrandForeground1)',
  },
});

interface ServiceLocation {
  id: string;
  name: string;
  city: string;
  state: string;
  postalCode: string;
}

interface Service {
  serviceName: string;
  serviceId: string;
  accountName: string;
  billingAccountNumber?: string;
  status: string;
  productGroup: string;
  productCategory?: string;
  product: string;
  circuitId: string | null;
  fiberInventoryId?: string | null;
  customerCircuitId?: string | null;
  legacyCircuitId?: string | null;
  bandwidth: string;
  term: number;
  totalMrc: number;
  customerPO?: string;
  termStartDate: string;
  termEndDate: string;
  serviceNoticePeriodDays?: number | null;
  renewalIntervalMonths?: number | null;
  renewalTermType?: string | null;
  components?: Array<{
    locations?: ServiceLocation[];
  }>;
}

interface ServiceResultData {
  apiVersion: string;
  data: {
    records: Service[];
    metadata: {
      totalRecordCount: number;
      currentPage: number;
      totalPages: number;
    };
  };
}

interface ServiceResultCardProps {
  services: ServiceResultData;
  compMaxHeight?: number;
}

const ServiceItem: React.FC<{ service: Service }> = React.memo(({ service }) => {
  const styles = useStyles();
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('active')) return 'success';
    if (statusLower.includes('pending')) return 'warning';
    if (statusLower.includes('disconnect')) return 'danger';
    return 'informative';
  };

  const locations = service.components?.flatMap((c) => c.locations || []) || [];
  const hasLocations = locations.length > 0;

  return (
    <div className={styles.serviceItem}>
      <div className={styles.serviceRow} onClick={() => hasLocations && setIsExpanded(!isExpanded)}>
        <div className={styles.serviceHeader}>
          <div className={styles.serviceInfo}>
            <Text className={styles.serviceName}>#{service.serviceName}</Text>
            <span className={styles.productPill}>{service.product}</span>
            {service.productCategory && (
              <Text style={{ fontSize: '11px', color: tokens.colorNeutralForeground3 }}>
                ({service.productCategory})
              </Text>
            )}
            {service.circuitId && <Text className={styles.circuitId}>ID: {service.circuitId}</Text>}
          </div>
          <div className={styles.rightSection}>
            <Badge appearance="filled" color={getStatusColor(service.status)} size="small">
              {service.status}
            </Badge>
            {hasLocations &&
              (isExpanded ? (
                <ChevronUp16Regular className={styles.chevronIcon} />
              ) : (
                <ChevronDown16Regular className={styles.chevronIcon} />
              ))}
          </div>
        </div>

        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Account</Text>
            <Text className={styles.detailValue}>{service.accountName}</Text>
          </div>
          {service.billingAccountNumber && (
            <div className={styles.detailItem}>
              <Text className={styles.detailLabel}>Billing Acct #</Text>
              <Text className={styles.detailValue}>{service.billingAccountNumber}</Text>
            </div>
          )}
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Bandwidth</Text>
            <Text className={styles.detailValue}>{service.bandwidth}</Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Monthly Cost</Text>
            <Text className={styles.detailValue}>${service.totalMrc?.toLocaleString()}</Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Term</Text>
            <Text className={styles.detailValue}>{service.term} months</Text>
          </div>
          {service.customerPO && service.customerPO !== 'N/A' && (
            <div className={styles.detailItem}>
              <Text className={styles.detailLabel}>Customer PO</Text>
              <Text className={styles.detailValue}>{service.customerPO}</Text>
            </div>
          )}
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Start Date</Text>
            <Text className={styles.detailValue}>{service.termStartDate}</Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>End Date</Text>
            <Text className={styles.detailValue}>{service.termEndDate}</Text>
          </div>
          {service.renewalTermType && (
            <div className={styles.detailItem}>
              <Text className={styles.detailLabel}>Renewal Type</Text>
              <Text className={styles.detailValue}>{service.renewalTermType}</Text>
            </div>
          )}
          {service.fiberInventoryId && (
            <div className={styles.detailItem}>
              <Text className={styles.detailLabel}>Fiber Inventory ID</Text>
              <Text className={styles.detailValue}>{service.fiberInventoryId}</Text>
            </div>
          )}
        </div>
      </div>

      {isExpanded && hasLocations && (
        <div className={styles.locationsExpandedRow}>
          <Text className={styles.locationsTitle}>Locations ({locations.length})</Text>
          <div className={styles.locationsList}>
            {locations.map((loc) => (
              <div key={loc.id} className={styles.locationItem}>
                {loc.name} - {loc.city}, {loc.state} {loc.postalCode}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

const ServiceResultCard: React.FC<ServiceResultCardProps> = ({ services, compMaxHeight }) => {
  const styles = useStyles();

  const records = services?.data?.records || [];
  const totalRecords = services?.data?.metadata?.totalRecordCount || 0;

  if (records.length === 0) {
    return <EmptyState message="No services found matching your criteria." icon={<BuildingMultiple20Regular />} />;
  }

  return (
    <>
      <Card
        className={styles.card}
        style={
          compMaxHeight ? { maxHeight: `${compMaxHeight}px`, overflowY: 'auto', scrollbarWidth: 'thin' } : {}
        }
      >
        <div className={styles.listContainer}>
          {records.map((service) => (
            <ServiceItem key={service.serviceId} service={service} />
          ))}
        </div>
      </Card>
      <div className={styles.footer}>
        <Text className={styles.footerText}>
          Displaying {records.length} of {totalRecords} total services
        </Text>
      </div>
    </>
  );
};

export default ServiceResultCard;
