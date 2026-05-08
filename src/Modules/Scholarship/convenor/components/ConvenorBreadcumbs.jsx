import { Flex } from "@mantine/core";
import { useState } from "react";
import ConvenorPage from "../pages/Convenor";
import InviteApplications from "../forms/inviteApplications";
import MCMApplications from "./MCM_Applications";
import ModuleTabs from "../../../../components/moduleTabs";

function ConvenorBreadcrumbs() {
  const [activeTab, setActiveTab] = useState("0");

  const tabItems = [
    { title: "Catalog" },
    { title: "Invite Application" },
    { title: "Browse Application" },
  ];

  const tabComponents = [
    <ConvenorPage key="catalog" />,
    <InviteApplications key="invite" />,
    <MCMApplications key="browse" />,
  ];

  const ActiveComponent = tabComponents[parseInt(activeTab, 10)];

  return (
    <>
      <Flex
        justify="space-between"
        align="center"
        mt={{ base: "1.5rem", md: "2rem" }}
        mb="lg"
      >
        <ModuleTabs
          tabs={tabItems}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </Flex>
      <div style={{ marginTop: '20px' }}>
        {ActiveComponent}
      </div>
    </>
  );
}

export default ConvenorBreadcrumbs;
