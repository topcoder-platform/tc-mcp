import React from "react";
import {
  Card,
  CardPreview,
  makeStyles,
  shorthands,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Text,
  Link,
  Button,
} from "@fluentui/react-components";
import { bundleIcon, Open20Filled, Open20Regular, SearchInfo24Regular } from "@fluentui/react-icons";
import { useChat } from "../../context/ChatContext";
import ChallengeDetailsView from "./ChallengeDetailsView";
import SkillBadge from "./SkillBadge";
import EmptyState from "./EmptyState";
import { useViewport } from "../../hooks/useViewport"; // Import the viewport hook

const useStyles = makeStyles({
  card: {
    width: "100%",
    ...shorthands.margin("10px", "0"),
  },
  table: {
    width: "100%",
    tableLayout: "fixed",
    "& th": {
      fontWeight: "600",
      padding: "8px 16px",
    },
    "& td": {
      padding: "8px 16px",
      paddingBottom: 0,
    },
  },
  footer: {
    ...shorthands.padding("0", "8px"),
    display: "flex",
    justifyContent: "end",
    alignItems: "center",
  },
  footerText: {
    fontSize: "12px",
    fontWeight: "600",
    color: "var(--colorBrandForeground1)",
  },
  cellContent: {
    textOverflow: "ellipsis",
    overflow: "hidden",
    whiteSpace: "nowrap",
  },
  rowGroup: {
    "&:hover": {
      "& > tr": {
        backgroundColor: "var(--colorNeutralBackground1Hover)",
      },
    },
    ...shorthands.borderBottom("1px", "solid", "var(--colorNeutralStroke2)"),
  },
  noBorder: {
    ...shorthands.borderBottom("none"),
  },
  // --- NEW: Responsive utility class to hide elements on small screens ---
  hideOnMobile: {
    "@media (max-width: 539px)": {
      display: "none",
    },
  },
});

interface Challenge {
  id: string;
  name: string;
  status: string;
  track: string;
  type: string;
  description: string;
  created: string;
  updated: string;
  startDate: string;
  endDate: string;
  overview?: { totalPrizes?: number };
  skills?: { name: string }[];
  numOfRegistrants: number;
  numOfSubmissions: number;
  currentPhaseNames: string[];
  createdBy: string;
  projectId: number;
}
interface ChallengeResultData {
  page: number;
  pageSize: number;
  total: number;
  data: Challenge[];
}
interface ChallengeResultCardProps {
  data: ChallengeResultData;
  compMaxHeight?: number;
}

const ViewDetailsIcon = bundleIcon(Open20Filled, Open20Regular);

const ChallengeResultCard: React.FC<ChallengeResultCardProps> = ({ data, compMaxHeight }) => {
  const styles = useStyles();
  const { openSheet } = useChat();
  const { width } = useViewport(); // Get screen width
  const isMobile = width < 540; // Define the mobile breakpoint

  const handleViewDetails = (challenge: Challenge) => {
    openSheet(<ChallengeDetailsView challenge={challenge} />);
  };

  if (!data || !Array.isArray(data.data) || data.data.length === 0) {
    return <EmptyState message="No challenges found matching your criteria." icon={<SearchInfo24Regular />} />;
  }

  return (
    <>
      <Card className={styles.card} style={compMaxHeight ? { maxHeight: `${compMaxHeight}px`, overflowY: "auto", scrollbarWidth: "thin" } : {}}>
        <CardPreview>
          <Table size="small" className={styles.table}>
            <TableHeader>
              <TableRow>
                {/* Adjust column widths based on screen size */}
                <TableHeaderCell style={{ width: isMobile ? "85%" : "50%" }}>Challenge</TableHeaderCell>
                {/* Hide these columns on mobile */}
                <TableHeaderCell className={styles.hideOnMobile} style={{ width: "15%" }}>
                  Status
                </TableHeaderCell>
                <TableHeaderCell className={styles.hideOnMobile} style={{ width: "15%" }}>
                  Prize
                </TableHeaderCell>
                <TableHeaderCell className={styles.hideOnMobile} style={{ width: "15%" }}>
                  Track
                </TableHeaderCell>
                <TableHeaderCell style={{ width: isMobile ? "15%" : "5%", textAlign: "center", opacity: 0 }}>Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            {data.data.map((challenge) => (
              // The original <TableBody> structure is preserved
              <TableBody key={challenge.id} className={styles.rowGroup}>
                <TableRow className={styles.noBorder}>
                  <TableCell>
                    <div className={styles.cellContent}>
                      <Link href={`https://www.topcoder.com/challenges/${challenge.id}`} target="_blank" rel="noopener noreferrer" title={challenge.name}>
                        <Text weight="semibold">{challenge.name}</Text>
                      </Link>
                    </div>
                  </TableCell>
                  {/* Hide these cells on mobile */}
                  <TableCell className={styles.hideOnMobile}>
                    <div className={styles.cellContent} title={challenge.status}>
                      <Text>{challenge.status}</Text>
                    </div>
                  </TableCell>
                  <TableCell className={styles.hideOnMobile}>
                    <div className={styles.cellContent}>
                      <Text weight="semibold">{challenge.overview?.totalPrizes ? `$${challenge.overview.totalPrizes.toLocaleString()}` : "N/A"}</Text>
                    </div>
                  </TableCell>
                  <TableCell className={styles.hideOnMobile}>
                    <div className={styles.cellContent} title={challenge.track}>
                      <Text>{challenge.track}</Text>
                    </div>
                  </TableCell>
                  <TableCell style={{ textAlign: "center" }}>
                    <Button appearance="subtle" icon={<ViewDetailsIcon />} onClick={() => handleViewDetails(challenge)}></Button>
                  </TableCell>
                </TableRow>
                <TableRow className={styles.noBorder}>
                  <TableCell colSpan={isMobile ? 2 : 5} style={{ paddingBottom: "12px" }}>
                    {challenge.skills?.length && <SkillBadge skills={challenge.skills} />}
                  </TableCell>
                </TableRow>
              </TableBody>
            ))}
          </Table>
        </CardPreview>
      </Card>
      <div className={styles.footer}>
        <Text className={styles.footerText}>
          Showing {data.data.length} of {data.total} challenges
        </Text>
      </div>
    </>
  );
};

export default ChallengeResultCard;