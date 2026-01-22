import React, { useState } from 'react';
import {
  Card,
  makeStyles,
  shorthands,
  Text,
  tokens,
  Badge,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Button,
  Tag,
} from '@fluentui/react-components';
import {
  ChevronDown20Regular,
  ChevronUp20Regular,
  BuildingMultiple24Regular,
} from '@fluentui/react-icons';
import EmptyState from '../EmptyState';
import { useViewport, type ViewMode } from '../../../hooks/useViewport';

const useStyles = makeStyles({
  card: {
    width: '100%',
    padding: '0px',
    margin: '10px 0',
  },
  table: {
    width: '100%',
    tableLayout: 'fixed',
    '& th': {
      fontWeight: '600',
      padding: '8px 16px',
    },
    '& td': {
      padding: '8px 16px',
      verticalAlign: 'middle',
    },
  },
  rowGroup: {
    '&:hover': {
      '& > tr': {
        backgroundColor: tokens.colorNeutralBackground1Hover,
      },
    },
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
  },
  accountText: {
    fontSize: '14px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    overflowWrap: 'anywhere',
  },
  noBorder: {
    borderBottom: 'none',
  },
  cellContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    overflow: 'hidden',
  },
  primaryText: {
    fontSize: '14px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  secondaryText: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground2,
  },
  productPill: {
    fontSize: '11px',
    padding: '2px 8px',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    color: '#3b82f6',
    borderRadius: '8px',
    fontWeight: tokens.fontWeightMedium,
    display: 'inline-block',
    width: 'fit-content',
  },
  expandedContainer: {
    display: 'flex',
    gap: '24px',
    padding: '16px 24px',
    backgroundColor: tokens.colorNeutralBackground2,
    '@media (max-width: 768px)': {
      flexDirection: 'column',
    },
  },
  leftColumn: {
    flex: '0 0 70%',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  rightColumn: {
    flex: '1',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    alignContent: 'start',
  },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  detailLabel: {
    fontSize: '10px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground1,
  },
  locationItem: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground1,
    padding: '4px 0',
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  footer: {
    ...shorthands.padding('0', '8px'),
    display: 'flex',
    justifyContent: 'end',
    alignItems: 'center',
    marginTop: '8px',
  },
  footerText: {
    fontSize: '12px',
    fontWeight: '600',
    color: tokens.colorBrandForeground1,
  },
  hideOnMobile: {
    '@media (max-width: 600px)': {
      display: 'none',
    },
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

const ServiceRow: React.FC<{
  service: Service;
  styles: any;
  viewMode: ViewMode;
}> = ({ service, styles, viewMode }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('active')) return 'success';
    if (statusLower.includes('pending')) return 'warning';
    if (statusLower.includes('disconnect')) return 'danger';
    return 'informative';
  };

  const locations = service.components?.flatMap((c) => c.locations || []) || [];

  return (
    <TableBody className={styles.rowGroup}>
      <TableRow
        className={styles.noBorder}
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ cursor: 'pointer' }}
      >
        {/* Service / ID Column */}
        <TableCell>
          <div className={styles.cellContent}>
            <Text className={styles.primaryText}>#{service.serviceName}</Text>
            <Tag shape="rounded" size="small">
              {service.product}
            </Tag>
            {/* Show extra info on smaller screens */}
            {viewMode !== 'large' && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  marginTop: '4px',
                }}
              >
                {viewMode === 'small' && (
                  <Text className={styles.secondaryText}>
                    {service.accountName}
                  </Text>
                )}
                <Text className={styles.secondaryText}>
                  {service.bandwidth} •{' '}
                  {service.totalMrc
                    ? `$${service.totalMrc.toLocaleString()}`
                    : ''}{' '}
                  • {service.term} mos
                </Text>
              </div>
            )}
          </div>
        </TableCell>

        {/* Account Column - Visible on Medium & Large */}
        {viewMode !== 'small' && (
          <TableCell>
            <div className={styles.cellContent}>
              <Text className={styles.accountText}>{service.accountName}</Text>
              {service.billingAccountNumber && (
                <Text className={styles.secondaryText}>
                  Acct: {service.billingAccountNumber}
                </Text>
              )}
            </div>
          </TableCell>
        )}

        {/* Cost Column - Visible on Large only */}
        {viewMode === 'large' && (
          <TableCell>
            <Text className={styles.primaryText}>
              {service.totalMrc ? `$${service.totalMrc.toLocaleString()}` : '-'}
            </Text>
          </TableCell>
        )}

        {/* Term Column - Visible on Large only */}
        {viewMode === 'large' && (
          <TableCell>
            <div className={styles.cellContent}>
              <Text className={styles.primaryText}>{service.term} mos</Text>
              {service.termEndDate && (
                <Text className={styles.secondaryText}>
                  Ends: {service.termEndDate}
                </Text>
              )}
            </div>
          </TableCell>
        )}

        {/* Status Column - Always Visible */}
        <TableCell>
          <Badge
            appearance="filled"
            color={getStatusColor(service.status)}
            size="small"
            style={{ width: '100%', maxWidth: '100%' }}
          >
            <span
              style={{
                display: 'block',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {service.status}
            </span>
          </Badge>
        </TableCell>

        {/* Action Column */}
        <TableCell style={{ paddingRight: '12px', textAlign: 'center' }}>
          <Button
            appearance="subtle"
            icon={
              isExpanded ? <ChevronUp20Regular /> : <ChevronDown20Regular />
            }
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          />
        </TableCell>
      </TableRow>

      {/* Expanded Details */}
      {isExpanded && (
        <TableRow className={styles.noBorder}>
          <TableCell
            colSpan={viewMode === 'large' ? 6 : viewMode === 'medium' ? 4 : 3}
            style={{ padding: 0 }}
          >
            <div className={styles.expandedContainer}>
              {/* Left Column (70%) - Locations */}
              <div className={styles.leftColumn}>
                <Text className={styles.sectionTitle}>
                  Associated Locations ({locations.length})
                </Text>
                {locations.length > 0 ? (
                  locations.map((loc) => (
                    <div key={loc.id} className={styles.locationItem}>
                      <Text weight="semibold">{loc.name}</Text>
                      <Text
                        style={{
                          marginLeft: '8px',
                          color: tokens.colorNeutralForeground2,
                        }}
                      >
                        {loc.city}, {loc.state} {loc.postalCode}
                      </Text>
                    </div>
                  ))
                ) : (
                  <Text className={styles.secondaryText}>
                    No locations linked.
                  </Text>
                )}
              </div>

              {/* Right Column (30%) - Additional Details */}
              <div className={styles.rightColumn}>
                <div className={styles.detailItem}>
                  <Text className={styles.detailLabel}>Bandwidth</Text>
                  <Text className={styles.detailValue}>
                    {service.bandwidth}
                  </Text>
                </div>
                {service.circuitId && (
                  <div className={styles.detailItem}>
                    <Text className={styles.detailLabel}>Circuit ID</Text>
                    <Text className={styles.detailValue}>
                      {service.circuitId}
                    </Text>
                  </div>
                )}
                {service.customerPO && (
                  <div className={styles.detailItem}>
                    <Text className={styles.detailLabel}>Customer PO</Text>
                    <Text className={styles.detailValue}>
                      {service.customerPO || 'N/A'}
                    </Text>
                  </div>
                )}
                <div className={styles.detailItem}>
                  <Text className={styles.detailLabel}>Start Date</Text>
                  <Text className={styles.detailValue}>
                    {service.termStartDate || 'N/A'}
                  </Text>
                </div>
                <div className={styles.detailItem}>
                  <Text className={styles.detailLabel}>End Date</Text>
                  <Text className={styles.detailValue}>
                    {service.termEndDate || 'N/A'}
                  </Text>
                </div>
                {service.renewalTermType && (
                  <div className={styles.detailItem}>
                    <Text className={styles.detailLabel}>Renewal Type</Text>
                    <Text className={styles.detailValue}>
                      {service.renewalTermType}
                    </Text>
                  </div>
                )}
                {service.fiberInventoryId && (
                  <div className={styles.detailItem}>
                    <Text className={styles.detailLabel}>Fiber Inv ID</Text>
                    <Text className={styles.detailValue}>
                      {service.fiberInventoryId}
                    </Text>
                  </div>
                )}
                {service.productCategory && (
                  <div className={styles.detailItem}>
                    <Text className={styles.detailLabel}>Category</Text>
                    <Text className={styles.detailValue}>
                      {service.productCategory}
                    </Text>
                  </div>
                )}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  );
};

const ServiceResultCard: React.FC<ServiceResultCardProps> = ({
  services,
  compMaxHeight,
}) => {
  const styles = useStyles();
  const { viewMode } = useViewport();

  const records = services?.data?.records || [];
  const totalRecords = services?.data?.metadata?.totalRecordCount || 0;

  if (records.length === 0) {
    return (
      <EmptyState
        message="No services found matching your criteria."
        icon={<BuildingMultiple24Regular />}
      />
    );
  }

  return (
    <>
      <Card
        className={styles.card}
        style={
          compMaxHeight
            ? {
                maxHeight: `${compMaxHeight}px`,
                overflowY: 'auto',
                scrollbarWidth: 'thin',
              }
            : {}
        }
      >
        <Table size="small" className={styles.table}>
          <TableHeader>
            <TableRow>
              {/* Service Column: Width Adapts */}
              <TableHeaderCell
                style={{
                  width:
                    viewMode === 'small'
                      ? '60%'
                      : viewMode === 'medium'
                        ? '40%'
                        : '25%',
                }}
              >
                Service
              </TableHeaderCell>

              {/* Account Column: Hidden on Small */}
              {viewMode !== 'small' && (
                <TableHeaderCell
                  style={{ width: viewMode === 'medium' ? '35%' : '25%' }}
                >
                  Account
                </TableHeaderCell>
              )}

              {/* Cost Column: Large Only */}
              {viewMode === 'large' && (
                <TableHeaderCell style={{ width: '15%' }}>Cost</TableHeaderCell>
              )}

              {/* Term Column: Large Only */}
              {viewMode === 'large' && (
                <TableHeaderCell style={{ width: '15%' }}>Term</TableHeaderCell>
              )}

              {/* Status Column: Width Adapts */}
              <TableHeaderCell
                style={{
                  width:
                    viewMode === 'small'
                      ? '25%'
                      : viewMode === 'medium'
                        ? '20%'
                        : '15%',
                }}
              >
                Status
              </TableHeaderCell>

              {/* Action Column: Fixed safe width */}
              <TableHeaderCell style={{ width: '50px' }} />
            </TableRow>
          </TableHeader>

          {records.map((service) => (
            <ServiceRow
              key={service.serviceId}
              service={service}
              styles={styles}
              viewMode={viewMode}
            />
          ))}
        </Table>
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
