import React, { useState } from "react";
import { Flex } from "@mantine/core";
import ConvenerCatalog from "../../components/tables/ConvenerCatalog";
import ConvenerApplicationsTable from "../../components/tables/ConvenerApplicationsTable";
import MeritList from "../../components/tables/MeritList";
import SpacsMembers from "../components/spacsMembersC";
import PreviousWinners from "../components/previousWinnerC";
import styles from "./Convenor.module.css";
import ModuleTabs from "../../../../components/moduleTabs";

function ConvenorPage() {
  const [activeTab, setActiveTab] = useState("0");

  const tabItems = [
    { title: "Awards Management" },
    { title: "Review Applications" },
    { title: "Merit List" },
    { title: "SPACS Members" },
    { title: "Previous Winners" }
  ];

  const tabComponents = [
    <ConvenerCatalog key="awards" />,
    <ConvenerApplicationsTable key="apps" />,
    <MeritList key="merit_list" />,
    <SpacsMembers key="spacs" />,
    <PreviousWinners key="winners" />
  ];

  const ActiveComponent = tabComponents[parseInt(activeTab, 10)];

  return (
    <div className={styles.pageBackground || ""} style={{ padding: '20px' }}>
      <div className={styles.wrapper || ""}>
        {/* Navigation Tabs */}
        <Flex justify="space-between" align="center" mb="lg">
          <ModuleTabs
            tabs={tabItems}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </Flex>

        {/* Content */}
        <div style={{ marginTop: '20px' }}>
          {ActiveComponent}
        </div>
      </div>
    </div>
  );
}

export default ConvenorPage;
