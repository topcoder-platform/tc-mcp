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
  DocumentBulletList24Regular,
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
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  wrapText: {
    whiteSpace: 'normal',
    display: '-webkit-box',
    '-webkit-line-clamp': '2',
    '-webkit-box-orient': 'vertical',
    overflow: 'hidden',
  },
  ticketTypePill: {
    fontSize: '11px',
    padding: '2px 8px',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    color: '#8b5cf6',
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
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  descriptionText: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground1,
    whiteSpace: 'pre-wrap',
    lineHeight: '1.6',
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

interface Ticket {
  circuitId?: string | null;
  componentId: string;
  customerReferenceId?: string | null;
  dateTimeClosed: string | null;
  dateTimeOpened: string;
  description: string;
  serviceId: string;
  status: string;
  serviceName: string;
  subject: string;
  ticketId: string;
  ticketNumber: string;
  ticketType: string;
  subStatus?: string | null;
}

interface TicketResultData {
  apiVersion: string;
  data: {
    records: Ticket[];
    metadata: {
      totalRecordCount: number;
      currentPage: number;
      totalPages: number;
    };
  };
}

interface TicketResultCardProps {
  tickets: TicketResultData;
  compMaxHeight?: number;
}

const TicketRow: React.FC<{
  ticket: Ticket;
  styles: any;
  viewMode: ViewMode;
}> = ({ ticket, styles, viewMode }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('closed') || statusLower.includes('resolved'))
      return 'success';
    if (
      statusLower.includes('action required') ||
      statusLower.includes('pending')
    )
      return 'warning';
    if (statusLower.includes('open') || statusLower.includes('in progress'))
      return 'informative';
    return 'subtle';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      ' ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  };

  return (
    <TableBody className={styles.rowGroup}>
      <TableRow
        className={styles.noBorder}
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ cursor: 'pointer' }}
      >
        {/* Ticket / Number Column */}
        <TableCell>
          <div className={styles.cellContent}>
            <Text className={styles.primaryText}>{ticket.ticketNumber}</Text>
            <Tag shape="rounded" size="small">
              {ticket.ticketType}
            </Tag>
            {/* Show extra info on smaller screens */}
            {viewMode === 'small' && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  marginTop: '4px',
                }}
              >
                <Text className={`${styles.secondaryText} ${styles.wrapText}`}>
                  {ticket.subject}
                </Text>
                <Text className={styles.secondaryText}>
                  #{ticket.serviceName} • {formatDate(ticket.dateTimeOpened)}
                </Text>
              </div>
            )}
          </div>
        </TableCell>

        {/* Subject Column - Visible on Medium & Large */}
        {viewMode !== 'small' && (
          <TableCell>
            <Text
              className={`${styles.primaryText} ${styles.wrapText}`}
              title={ticket.subject}
            >
              {ticket.subject}
            </Text>
          </TableCell>
        )}

        {/* Service Column - Visible on Large only */}
        {viewMode === 'large' && (
          <TableCell>
            <div className={styles.cellContent}>
              <Text className={styles.primaryText}>#{ticket.serviceName}</Text>
              {ticket.circuitId && (
                <Text className={styles.secondaryText}>{ticket.circuitId}</Text>
              )}
            </div>
          </TableCell>
        )}

        {/* Opened Column - Visible on Large Only */}
        {viewMode === 'large' && (
          <TableCell>
            <Text className={styles.primaryText}>
              {formatDate(ticket.dateTimeOpened)}
            </Text>
          </TableCell>
        )}

        {/* Status Column */}
        <TableCell>
          <Badge
            appearance="filled"
            color={getStatusColor(ticket.status)}
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
              {ticket.status}
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
              {/* Left Column (70%) - Description */}
              <div className={styles.leftColumn}>
                <Text className={styles.sectionTitle}>Description</Text>
                <Text className={styles.descriptionText}>
                  {ticket.description}
                </Text>
              </div>

              {/* Right Column (30%) - Additional Details */}
              <div className={styles.rightColumn}>
                {ticket.dateTimeClosed && (
                  <div className={styles.detailItem}>
                    <Text className={styles.detailLabel}>Closed Date</Text>
                    <Text className={styles.detailValue}>
                      {formatDate(ticket.dateTimeClosed)}
                    </Text>
                  </div>
                )}
                {ticket.subStatus && (
                  <div className={styles.detailItem}>
                    <Text className={styles.detailLabel}>Sub-Status</Text>
                    <Text className={styles.detailValue}>
                      {ticket.subStatus}
                    </Text>
                  </div>
                )}
                {ticket.customerReferenceId && (
                  <div className={styles.detailItem}>
                    <Text className={styles.detailLabel}>Customer Ref</Text>
                    <Text className={styles.detailValue}>
                      {ticket.customerReferenceId}
                    </Text>
                  </div>
                )}
                <div className={styles.detailItem}>
                  <Text className={styles.detailLabel}>Component ID</Text>
                  <Text className={styles.detailValue}>
                    {ticket.componentId}
                  </Text>
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  );
};

const TicketResultCard: React.FC<TicketResultCardProps> = ({
  tickets,
  compMaxHeight,
}) => {
  const styles = useStyles();
  const { viewMode } = useViewport();

  const records = tickets?.data?.records || [];
  const totalRecords = tickets?.data?.metadata?.totalRecordCount || 0;

  if (records.length === 0) {
    return (
      <EmptyState
        message="No tickets found matching your criteria."
        icon={<DocumentBulletList24Regular />}
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
              {/* Ticket Column */}
              <TableHeaderCell
                style={{
                  width:
                    viewMode === 'small'
                      ? '60%'
                      : viewMode === 'medium'
                        ? '30%'
                        : '15%',
                }}
              >
                Ticket
              </TableHeaderCell>

              {/* Subject Column - Hidden on Small */}
              {viewMode !== 'small' && (
                <TableHeaderCell
                  style={{ width: viewMode === 'medium' ? '45%' : '25%' }}
                >
                  Subject
                </TableHeaderCell>
              )}

              {/* Service Column - Large Only */}
              {viewMode === 'large' && (
                <TableHeaderCell style={{ width: '20%' }}>
                  Service
                </TableHeaderCell>
              )}

              {/* Opened Column - Large Only */}
              {viewMode === 'large' && (
                <TableHeaderCell style={{ width: '20%' }}>
                  Opened
                </TableHeaderCell>
              )}

              {/* Status Column */}
              <TableHeaderCell
                style={{
                  width:
                    viewMode === 'small'
                      ? '25%'
                      : viewMode === 'medium'
                        ? '15%'
                        : '15%',
                }}
              >
                Status
              </TableHeaderCell>

              {/* Action Column */}
              <TableHeaderCell style={{ width: '50px' }} />
            </TableRow>
          </TableHeader>

          {records.map((ticket) => (
            <TicketRow
              key={ticket.ticketId}
              ticket={ticket}
              styles={styles}
              viewMode={viewMode}
            />
          ))}
        </Table>
      </Card>
      <div className={styles.footer}>
        <Text className={styles.footerText}>
          Displaying {records.length} of {totalRecords} total tickets
        </Text>
      </div>
    </>
  );
};

export default TicketResultCard;
