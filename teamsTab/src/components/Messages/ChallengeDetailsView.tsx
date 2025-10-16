import React from 'react';
import { makeStyles, shorthands, Title3, Subtitle2, Link, Divider } from "@fluentui/react-components";
import { Link20Color, Trophy20Regular } from "@fluentui/react-icons";
import { MarkdownRenderer } from "../MarkdownRenderer";
import SkillBadge from "./SkillBadge";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    ...shorthands.padding("0", "8px"), // Add some horizontal padding
  },
  header: {
    display: "flex",
    flexDirection: "column",
  },
  title: {
    "@media (max-width: 539px)": {
      fontSize: "var(--fontSizeBase500)",
      lineHeight: "var(--lineHeightBase500)",
    },
  },
  subHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
  },
  metaInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    flex: "1 1 70%",
    minWidth: 0,
  },
  prizeInfo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  titleLink: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  keyMetricsBar: {
    display: "flex",
    justifyContent: "space-around",
    textAlign: "center",
    gap: "16px",
  },
  metric: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  metricLabelIcon: {
    color: "var(--colorNeutralForeground3)", // Use a subtle color
  },
  infoTable: {
    width: "100%",
    borderCollapse: "collapse",
  },
  infoTableRow: {
    ...shorthands.borderBottom("1px", "solid", "var(--colorNeutralStroke3)"),
    "&:last-child": {
      ...shorthands.borderBottom("none"),
    },
  },
  infoKeyCell: {
    ...shorthands.padding("8px", "0"),
    color: "var(--colorNeutralForeground2)",
  },
  infoValueCell: {
    ...shorthands.padding("8px", "0"),
    fontWeight: "var(--fontWeightSemibold)",
  },
  descriptionSection: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
});

// Full challenge interface
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

interface ChallengeDetailsViewProps {
  challenge: Challenge;
}

const ChallengeDetailsView: React.FC<ChallengeDetailsViewProps> = ({ challenge }) => {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <Title3 as="h2" className={styles.title}>
          {challenge.name}
        </Title3>

        <div className={styles.subHeader}>
          {/* Left Column (70%) */}
          <div className={styles.metaInfo}>
            <div className={styles.titleLink}>
              <Link20Color />
              <Link href={`https://www.topcoder.com/challenges/${challenge.id}`} target="_blank" rel="noopener noreferrer">
                View on Topcoder.com
              </Link>
            </div>
            {challenge.skills && challenge.skills.length > 0 && <SkillBadge skills={challenge.skills} />}
          </div>

          {/* Right Column (30%) */}
          <div className={styles.prizeInfo}>
            {/* <div className={styles.metric}> */}
            <Subtitle2 as="h3">${challenge.overview?.totalPrizes?.toLocaleString() || "N/A"}</Subtitle2>
            <Trophy20Regular
              className={styles.metricLabelIcon}
              aria-label="Total Prize" // Add aria-label for accessibility
            />
            {/* </div> */}
          </div>
        </div>
      </header>

      <Divider />
      <table className={styles.infoTable}>
        <tbody>
          <tr className={styles.infoTableRow}>
            <td className={styles.infoKeyCell}>Track / Type</td>
            <td className={styles.infoValueCell}>
              {challenge.track} / {challenge.type}
            </td>
          </tr>
          <tr className={styles.infoTableRow}>
            <td className={styles.infoKeyCell}>Key Dates</td>
            <td className={styles.infoValueCell}>
              {new Date(challenge.startDate).toLocaleDateString()} - {new Date(challenge.endDate).toLocaleDateString()}
            </td>
          </tr>
          <tr className={styles.infoTableRow}>
            <td className={styles.infoKeyCell}>Current Phases</td>
            <td className={styles.infoValueCell}>{challenge.currentPhaseNames.join(", ")}</td>
          </tr>
          <tr className={styles.infoTableRow}>
            <td className={styles.infoKeyCell}>Author</td>
            <td className={styles.infoValueCell}>{challenge.createdBy}</td>
          </tr>
          <tr className={styles.infoTableRow}>
            <td className={styles.infoKeyCell}>Project ID</td>
            <td className={styles.infoValueCell}>{challenge.projectId}</td>
          </tr>
        </tbody>
      </table>
      <MarkdownRenderer content={challenge.description} />
    </div>
  );
};

export default ChallengeDetailsView;