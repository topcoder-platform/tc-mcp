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
  DocumentBulletList20Regular,
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
  ticketItem: {
    display: 'flex',
    flexDirection: 'column',
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  ticketRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '12px',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  ticketHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  },
  ticketInfo: {
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
  ticketNumber: {
    fontSize: '14px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  ticketTypePill: {
    fontSize: '11px',
    padding: '2px 8px',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    color: '#8b5cf6',
    borderRadius: '8px',
    fontWeight: tokens.fontWeightMedium,
  },
  subject: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground2,
    fontWeight: tokens.fontWeightMedium,
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
  expandedRow: {
    padding: '12px',
    paddingTop: 0,
    backgroundColor: tokens.colorNeutralBackground2,
    borderTop: `1px solid ${tokens.colorNeutralStroke3}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  descriptionSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  descriptionTitle: {
    fontSize: '10px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  descriptionText: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground2,
    whiteSpace: 'pre-wrap',
    lineHeight: '1.5',
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

const TicketItem: React.FC<{ ticket: Ticket }> = React.memo(({ ticket }) => {
  const styles = useStyles();
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('closed') || statusLower.includes('resolved')) return 'success';
    if (statusLower.includes('action required') || statusLower.includes('pending')) return 'warning';
    if (statusLower.includes('open') || statusLower.includes('in progress')) return 'informative';
    return 'subtle';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={styles.ticketItem}>
      <div className={styles.ticketRow} onClick={() => setIsExpanded(!isExpanded)}>
        <div className={styles.ticketHeader}>
          <div className={styles.ticketInfo}>
            <Text className={styles.ticketNumber}>{ticket.ticketNumber}</Text>
            <span className={styles.ticketTypePill}>{ticket.ticketType}</span>
          </div>
          <div className={styles.rightSection}>
            <Badge appearance="filled" color={getStatusColor(ticket.status)} size="small">
              {ticket.status}
            </Badge>
            {isExpanded ? <ChevronUp16Regular className={styles.chevronIcon} /> : <ChevronDown16Regular className={styles.chevronIcon} />}
          </div>
        </div>

        <Text className={styles.subject}>{ticket.subject}</Text>

        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Service</Text>
            <Text className={styles.detailValue}>#{ticket.serviceName}</Text>
          </div>
          {ticket.circuitId && (
            <div className={styles.detailItem}>
              <Text className={styles.detailLabel}>Circuit ID</Text>
              <Text className={styles.detailValue}>{ticket.circuitId}</Text>
            </div>
          )}
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Opened</Text>
            <Text className={styles.detailValue}>{formatDate(ticket.dateTimeOpened)}</Text>
          </div>
          {ticket.dateTimeClosed && (
            <div className={styles.detailItem}>
              <Text className={styles.detailLabel}>Closed</Text>
              <Text className={styles.detailValue}>{formatDate(ticket.dateTimeClosed)}</Text>
            </div>
          )}
          {ticket.subStatus && (
            <div className={styles.detailItem}>
              <Text className={styles.detailLabel}>Sub-Status</Text>
              <Text className={styles.detailValue}>{ticket.subStatus}</Text>
            </div>
          )}
          {ticket.customerReferenceId && (
            <div className={styles.detailItem}>
              <Text className={styles.detailLabel}>Customer Ref</Text>
              <Text className={styles.detailValue}>{ticket.customerReferenceId}</Text>
            </div>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className={styles.expandedRow}>
          <div className={styles.descriptionSection}>
            <Text className={styles.descriptionTitle}>Description</Text>
            <Text className={styles.descriptionText}>{ticket.description}</Text>
          </div>
        </div>
      )}
    </div>
  );
});

const TicketResultCard: React.FC<TicketResultCardProps> = ({ tickets, compMaxHeight }) => {
  const styles = useStyles();

  const records = tickets?.data?.records || [];
  const totalRecords = tickets?.data?.metadata?.totalRecordCount || 0;

  if (records.length === 0) {
    return <EmptyState message="No tickets found matching your criteria." icon={<DocumentBulletList20Regular />} />;
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
          {records.map((ticket) => (
            <TicketItem key={ticket.ticketId} ticket={ticket} />
          ))}
        </div>
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
