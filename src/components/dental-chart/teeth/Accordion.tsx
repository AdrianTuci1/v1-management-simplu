import React, { useState } from "react";
import styles from "./Accordion.module.css";

interface AccordionProps {
  title: string;
  children: React.ReactNode;
}

const Accordion: React.FC<AccordionProps> = ({ title, children }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className={styles.accordion}>
      <div
        className={`${styles.accordionHeader} ${isExpanded ? styles.expanded : ""}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {title}
      </div>
      {isExpanded && <div className={styles.accordionBody}>{children}</div>}
    </div>
  );
};

export default Accordion;
