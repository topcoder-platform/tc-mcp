import React from 'react';
import { Spinner, makeStyles } from '@fluentui/react-components';

const useStyles = makeStyles({
  loaderContainer: {
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    flexDirection: "column",
    height: "100%",
    gap: "1rem",
  },
});

interface LoaderProps {
  message?: string;
}

const Loader: React.FC<LoaderProps> = ({ message }) => {
  const styles = useStyles();
  return (
    <div className={styles.loaderContainer}>
      <Spinner labelPosition="after" label={message} />
    </div>
  );
};

export default Loader;