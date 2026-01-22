import React, { useState } from 'react';
import {
  Card,
  makeStyles,
  Text,
  tokens,
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
  Location24Regular,
  CheckmarkCircle24Regular,
} from '@fluentui/react-icons';
import EmptyState from '../EmptyState';
import { useViewport } from '../../../hooks/useViewport';

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
  cellContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
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
  noBorder: {
    borderBottom: 'none',
  },
  expandedContainer: {
    padding: '16px',
    backgroundColor: tokens.colorNeutralBackground2,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '12px',
  },
  abilityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  abilityText: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground1,
  },
  footer: {
    padding: '8px 16px',
    display: 'flex',
    justifyContent: 'end',
    alignItems: 'center',
  },
  footerText: {
    fontSize: '12px',
    fontWeight: '600',
    color: tokens.colorBrandForeground1,
  },
});

interface Location {
  locationId: string;
  locationName: string; // e.g., "56 Marietta St NW/Fl-2/Rm-MMR/Cage-DRT - TelX"
  networkStatus: string; // "On Zayo Network"
  buildingClassification: string; // "On-Net"
  competitiveInternetEnablement: string; // "Yes"
  enabled: Record<string, boolean>; // {"IP-DIA": true, ...}
}

interface LocationResultData {
  apiVersion: string;
  data: {
    address: string;
    locations: Location[];
  };
}

interface LocationResultCardProps {
  data: LocationResultData;
  compMaxHeight?: number;
}

const LocationRow: React.FC<{
  location: Location;
  styles: any;
  viewMode: 'small' | 'medium' | 'large';
}> = ({ location, styles, viewMode }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract street/city from name if possible, or just use name
  const displayName = location.locationName.split('/')[0];

  return (
    <TableBody className={styles.rowGroup}>
      <TableRow
        className={styles.noBorder}
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ cursor: 'pointer' }}
      >
        {/* Address / Name */}
        <TableCell>
          <div className={styles.cellContent}>
            <Text className={styles.primaryText}>{displayName}</Text>
            {viewMode === 'small' && (
               <Text className={styles.secondaryText}>{location.buildingClassification}</Text>
            )}
          </div>
        </TableCell>

        {/* Status */}
        {viewMode !== 'small' && (
          <TableCell>
            <Tag 
              appearance="brand" 
              shape="rounded" 
              size="small"
              style={{
                backgroundColor: location.networkStatus.includes('On') ? '#dcfce7' : '#f3f4f6',
                color: location.networkStatus.includes('On') ? '#166534' : '#374151',
                border: 'none'
              }}
            >
              {location.networkStatus}
            </Tag>
          </TableCell>
        )}

        {/* Classification */}
        {viewMode !== 'small' && (
           <TableCell>
             <Text className={styles.secondaryText}>{location.buildingClassification}</Text>
           </TableCell>
        )}

        {/* Action */}
        <TableCell style={{ width: '50px', textAlign: 'center' }}>
          <Button
            appearance="subtle"
            icon={isExpanded ? <ChevronUp20Regular /> : <ChevronDown20Regular />}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          />
        </TableCell>
      </TableRow>

      {/* Expanded Details: Services Available */}
      {isExpanded && (
        <TableRow className={styles.noBorder}>
          <TableCell colSpan={viewMode === 'small' ? 2 : 4} style={{ padding: 0 }}>
            <div className={styles.expandedContainer}>
              <Text style={{ gridColumn: '1/-1', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: tokens.colorNeutralForeground3 }}>
                Available Services
              </Text>
              {Object.entries(location.enabled || {}).map(([service, isEnabled]) => (
                isEnabled && (
                  <div key={service} className={styles.abilityItem}>
                    <CheckmarkCircle24Regular style={{ width: '16px', color: tokens.colorPaletteGreenForeground1 }} />
                    <Text className={styles.abilityText}>{service}</Text>
                  </div>
                )
              ))}
            </div>
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  );
};

const LocationResultCard: React.FC<LocationResultCardProps> = ({ data, compMaxHeight }) => {
  const styles = useStyles();
  const { viewMode } = useViewport();
  const locations = data?.data?.locations || [];

  if (locations.length === 0) {
    return (
      <EmptyState
        message="No Zayo locations found for this address."
        icon={<Location24Regular />}
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
              <TableHeaderCell style={{ width: viewMode === 'small' ? '70%' : '40%' }}>Location</TableHeaderCell>
              {viewMode !== 'small' && <TableHeaderCell style={{ width: '30%' }}>Network Status</TableHeaderCell>}
              {viewMode !== 'small' && <TableHeaderCell style={{ width: '20%' }}>Type</TableHeaderCell>}
              <TableHeaderCell style={{ width: '50px' }} />
            </TableRow>
          </TableHeader>
          {locations.map((loc) => (
            <LocationRow key={loc.locationId} location={loc} styles={styles} viewMode={viewMode as any} />
          ))}
        </Table>
      </Card>
      <div className={styles.footer}>
        <Text className={styles.footerText}>
          Found {locations.length} matching locations
        </Text>
      </div>
    </>
  );
};

export default LocationResultCard;
