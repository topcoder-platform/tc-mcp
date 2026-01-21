import React from 'react';
import { Tag, TagGroup, makeStyles } from '@fluentui/react-components';

const useStyles = makeStyles({
  tagGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  },
});

interface SkillBadgeProps {
  skills: { name: string }[];
}

const SkillBadge: React.FC<SkillBadgeProps> = ({ skills }) => {
  const styles = useStyles();
  if (!skills || skills.length === 0) return null;

  return (
    <TagGroup className={styles.tagGroup} aria-label="Skills">
      {skills.map((skill) => (
        <Tag key={skill.name} shape="rounded" size="small">
          {skill.name}
        </Tag>
      ))}
    </TagGroup>
  );
};

export default SkillBadge;