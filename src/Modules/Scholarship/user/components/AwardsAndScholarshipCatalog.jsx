import React, { useState, useEffect } from "react";
import { List, Title, Divider, Container, Loader } from "@mantine/core";
import axios from "axios";
import styles from "./Catalog.module.css";
import { showAwardRoute } from "../../../../routes/SPACSRoutes";

function AwardsAndScholarshipCatalog() {
  const [selectedAward, setSelectedAward] = useState(null);
  const [awards, setAwards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleAwardSelect = (award) => {
    setSelectedAward(award);
  };

  useEffect(() => {
    const fetchAwardsData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await axios.get(`${showAwardRoute}?_t=${new Date().getTime()}`, {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        });
        setAwards(response.data);
        setSelectedAward(response.data[0]);
        setIsLoading(false);
      } catch (error) {
        console.error(
          "Error fetching awards data:",
          error.response ? error.response.data : error.message,
        );
        setIsLoading(false);
      }
    };

    fetchAwardsData();
  }, []);

  return (
    <Container className={styles.wrapper}>
      {isLoading ? (
        <Loader size="lg" />
      ) : (
        <>
          <div className={styles.listContainer}>
            <List spacing="sm" size="lg">
              {awards.map((award) => (
                <List.Item
                  key={award.id}
                  onClick={() => handleAwardSelect(award)}
                  className={`${styles.listItem} ${
                    selectedAward?.id === award.id ? styles.activeItem : ""
                  }`}
                >
                  {award.award_name || award.name}
                </List.Item>
              ))}
            </List>
          </div>

          <div className={styles.contentContainer}>
            {selectedAward && (
              <>
                <Title order={2}>
                  {selectedAward.award_name || selectedAward.name}
                </Title>
                <Divider my="sm" />

                <List size="md" spacing="sm">
                  {(selectedAward.catalog || selectedAward.description || "").split("\n").map((point, index) => (
                    <List.Item key={index}>{point}</List.Item>
                  ))}
                </List>
              </>
            )}
          </div>
        </>
      )}
    </Container>
  );
}

export default AwardsAndScholarshipCatalog;
