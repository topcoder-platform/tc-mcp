import React, { useMemo, useState } from "react";
import { Card, makeStyles, shorthands, Text, mergeClasses, tokens } from "@fluentui/react-components";
import { ChevronDown16Regular, ChevronUp16Regular, TagSearch20Regular } from "@fluentui/react-icons";
import EmptyState from "./EmptyState";
import SkillBadge from "./SkillBadge";
import { useViewport } from "../../hooks/useViewport";

const useStyles = makeStyles({
  card: {
    width: "100%",
    minWidth: "auto",
    maxWidth: "960px",
    padding: 0,
    gap: 0,
    margin: "12px 0",
  },
  title: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: "18px",
    lineHeight: "24px",
  },
  subtitle: {
    fontSize: "12px",
    color: tokens.colorNeutralForeground3,
  },
  badge: {
    backgroundColor: "rgba(59, 130, 246, 0.05)",
    color: "#1e40af",
    border: "1px solid rgba(59, 130, 246, 0.2)",
    ...shorthands.padding("4px", "8px"),
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: tokens.fontWeightMedium,
  },
  listContainer: {
    display: "flex",
    flexDirection: "column",
  },
  skillItem: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "12px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    "&:hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
    "&:last-child": {
      borderBottom: "none",
    },
  },
  skillHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    // gap: "4px",
    // marginBottom: "8px",
  },
  skillNameContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flex: "1",
    minWidth: "0",
  },
  skillPill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 10px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: tokens.fontWeightMedium,
    maxWidth: "100%",
  },
  // Skill pill color variants - badge style
  skillPill1: {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    border: "1px solid rgba(139, 92, 246, 0.3)",
    color: "#8b5cf6",
  },
  skillPill2: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    border: "1px solid rgba(59, 130, 246, 0.3)",
    color: "#3b82f6",
  },
  skillPill3: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    border: "1px solid rgba(16, 185, 129, 0.3)",
    color: "#10b981",
  },
  skillPill4: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    border: "1px solid rgba(245, 158, 11, 0.3)",
    color: "#f59e0b",
  },
  skillPill5: {
    backgroundColor: "rgba(192, 132, 252, 0.1)",
    border: "1px solid rgba(192, 132, 252, 0.3)",
    color: "#c084fc",
  },
  skillPill6: {
    backgroundColor: "rgba(8, 145, 178, 0.1)",
    border: "1px solid rgba(8, 145, 178, 0.3)",
    color: "#0891b2",
  },
  skillPill7: {
    backgroundColor: "rgba(225, 29, 72, 0.1)",
    border: "1px solid rgba(225, 29, 72, 0.3)",
    color: "#e11d48",
  },
  skillPill8: {
    backgroundColor: "rgba(234, 179, 8, 0.1)",
    border: "1px solid rgba(234, 179, 8, 0.3)",
    color: "#eab308",
  },
  description: {
    fontSize: "14px",
    color: tokens.colorNeutralForeground2,
    "@media (max-width: 540px)": {
      fontSize: "12px",
    },
  },
  toggleButton: {
    marginLeft: "8px",
    fontSize: "12px",
    fontWeight: tokens.fontWeightMedium,
    color: "var(--colorBrandForeground1)",
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    "&:hover": {
      color: "var(--colorBrandForeground2)",
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
});

interface Skill {
  id: string;
  name: string;
  description: string;
  category: {
    id: string;
    name: string;
  };
}

interface SkillResultData {
  total: number;
  data: Skill[];
}

interface SkillResultCardProps {
  skills: SkillResultData;
  compMaxHeight?: number;
}

const SkillItem: React.FC<{ skill: Skill; index: number; isMobile: boolean }> = React.memo(({ skill, index, isMobile }) => {
  const styles = useStyles();
  const [isExpanded, setIsExpanded] = useState(false);

  const getPillStyle = (index: number) => {
    const pillStyles = [
      styles.skillPill1,
      styles.skillPill2,
      styles.skillPill3,
      styles.skillPill4,
      styles.skillPill5,
      styles.skillPill6,
      styles.skillPill7,
      styles.skillPill8,
    ];
    return mergeClasses(styles.skillPill, pillStyles[index % pillStyles.length]);
  };

  const truncatedText = useMemo(() => {
    const truncateAt = isMobile ? 60 : 150;
    const truncateOffset = isMobile ? 20 : 50;

    if (skill.description.length <= truncateAt) {
      return null; // No truncation needed
    }

    const sliceEnd = Number((truncateAt + Math.random() * truncateOffset).toFixed(0));
    return skill.description.slice(0, sliceEnd) + "...";
  }, [skill.description, isMobile]);

  const shouldTruncate = truncatedText !== null;

  return (
    <div className={styles.skillItem}>
      <div className={styles.skillHeader}>
        <div className={styles.skillNameContainer}>
          <span className={getPillStyle(index)}>{skill.name}</span>
        </div>
        {!isMobile && <SkillBadge skills={[skill.category]} />}
      </div>

      <div className={styles.description}>
        {shouldTruncate && !isExpanded ? truncatedText : skill.description}
        {shouldTruncate && (
          <button onClick={() => setIsExpanded(!isExpanded)} className={styles.toggleButton}>
            {isExpanded ? (
              <>
                less
                <ChevronUp16Regular />
              </>
            ) : (
              <>
                more
                <ChevronDown16Regular />
              </>
            )}
          </button>
        )}
      </div>
      {isExpanded && isMobile && <SkillBadge skills={[skill.category]} />}
    </div>
  );
});

const SkillResultCard: React.FC<SkillResultCardProps> = ({ skills, compMaxHeight }) => {
  const styles = useStyles();
  const { width } = useViewport();
  const isMobile = width < 540;

  if (!skills || !Array.isArray(skills.data) || skills.data.length === 0) {
    return <EmptyState message="No skills found matching your criteria." icon={<TagSearch20Regular />} />;
  }

  return (
    <>
      <Card className={styles.card} style={compMaxHeight ? { maxHeight: `${compMaxHeight}px`, overflowY: "auto", scrollbarWidth: "thin" } : {}}>
        <div className={styles.listContainer}>
          {skills.data.map((skill, index) => (
            <SkillItem key={skill.id} skill={skill} index={index} isMobile={isMobile} />
          ))}
        </div>
      </Card>
      <div className={styles.footer}>
        <Text className={styles.footerText}>
          Displaying {skills.data.length} of {skills.total} total skills
        </Text>
      </div>
    </>
  );
};

export default SkillResultCard;
