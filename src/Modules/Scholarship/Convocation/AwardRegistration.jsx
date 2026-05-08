import React, { useState, useEffect } from "react";
import { Container, Select, Title, Alert, Box, Text, Badge } from "@mantine/core";
import { AlertCircle, Clock } from "tabler-icons-react";
import DirectorSilverForm from "./DirectorSilverForm";
import DirectorGoldForm from "./DirectorGoldForm";
import DMProficiencyForm from "./DMProficiencyForm";
import { checkApplicationWindow } from "../../../routes/SPACSRoutes";

const SPACS_API_URL = "http://localhost:8000/spacs"; // Adjust to match your API URL

export default function AwardRegistration() {
  const [selectedAward, setSelectedAward] = useState("");
  const [isEligible, setIsEligible] = useState(false);
  const [message, setMessage] = useState("");
  const [availableScholarships, setAvailableScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deadlineInfo, setDeadlineInfo] = useState(null);
  const [allAwards] = useState([
    {
      value: "Director's Silver Medal",
      label: "Director's Silver Medal",
    },
    { value: "Director's Gold Medal", label: "Director's Gold Medal" },
    {
      value: "D&M Proficiency Gold Medal",
      label: "D&M Proficiency Gold Medal",
    },
    {
      value: "Merit-cum-Means Scholarship",
      label: "Merit-cum-Means Scholarship",
    },
  ]);

  // Fetch active scholarships on component mount
  useEffect(() => {
    const fetchActiveScholarships = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch(`${SPACS_API_URL}/active-scholarships/`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });

        const data = await response.json();
        if (data.result === "Success" && data.scholarships.length > 0) {
          // Extract unique award names from active scholarships
          const uniqueAwards = [...new Set(data.scholarships.map(s => s.award_name))];
          
          // Filter the available awards to only those with active deadlines
          const filtered = allAwards.filter(award =>
            uniqueAwards.includes(award.value)
          );

          // Map to include deadline info in labels
          const enriched = filtered.map(award => {
            const scholarship = data.scholarships.find(s => s.award_name === award.value);
            return {
              ...award,
              deadline: scholarship?.enddate,
              daysRemaining: scholarship?.days_remaining,
              description: `Closes in ${scholarship?.days_remaining} days (${scholarship?.enddate})`,
            };
          });

          setAvailableScholarships(enriched);
          
          // Set first available scholarship as selected
          if (enriched.length > 0) {
            setSelectedAward(enriched[0].value);
          }
        } else {
          setAvailableScholarships([]);
          setMessage("No active scholarships available at the moment. Please check back later.");
        }
      } catch (error) {
        console.error("Error fetching active scholarships:", error);
        setMessage("Error loading available scholarships. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchActiveScholarships();
  }, []);

  // Fetch deadline info when award changes
  useEffect(() => {
    if (selectedAward) {
      fetchDeadlineInfo(selectedAward);
    }
  }, [selectedAward]);

  const fetchDeadlineInfo = async (awardName) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${SPACS_API_URL}/scholarship-deadline/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ award: awardName }),
      });

      const data = await response.json();
      if (data.result === "Success") {
        setDeadlineInfo(data);
        setIsEligible(data.is_open);
        setMessage(data.message);
      } else {
        setIsEligible(false);
        setMessage(data.message || "Deadline has passed for this scholarship.");
      }
    } catch (error) {
      console.error("Error fetching deadline info:", error);
      setIsEligible(false);
      setMessage("Error checking application window.");
    }
  };

  const renderForm = () => {
    if (loading) {
      return <Text align="center" mt="md">Loading available scholarships...</Text>;
    }

    if (availableScholarships.length === 0) {
      return (
        <Alert icon={<AlertCircle size={16} />} title="No Active Scholarships" color="yellow" mt="lg">
          {message || "No scholarships are currently open for applications. Please check back later."}
        </Alert>
      );
    }

    if (!isEligible) {
      return (
        <Alert icon={<Clock size={16} />} title="Application Window Closed" color="red" mt="lg">
          {message || "The application deadline has passed for this scholarship."}
        </Alert>
      );
    }

    switch (selectedAward) {
      case "Director's Silver Medal":
        return <DirectorSilverForm />;
      case "Director's Gold Medal":
        return <DirectorGoldForm />;
      case "D&M Proficiency Gold Medal":
        return <DMProficiencyForm />;
      default:
        return null;
    }
  };

  return (
    <Container size="lg">
      <Title order={2} mb="md">
        Award Registration Form
      </Title>

      {availableScholarships.length === 0 && !loading ? (
        <Alert icon={<AlertCircle size={16} />} title="No Active Scholarships" color="yellow">
          {message || "No scholarships are currently open for applications."}
        </Alert>
      ) : (
        <>
          <Select
            label="Select Award/Scholarship"
            placeholder="Choose an active scholarship"
            value={selectedAward}
            onChange={setSelectedAward}
            data={availableScholarships.map(award => ({
              value: award.value,
              label: award.label,
              description: award.description,
            }))}
            searchable
            disabled={availableScholarships.length === 0 || loading}
            clearable
          />

          {deadlineInfo && (
            <Box mt="md" p="md" style={{ backgroundColor: "#f0f0f0", borderRadius: "4px" }}>
              <Box style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <Text size="sm" weight={500}>Application Status:</Text>
                  <Text size="sm" color={isEligible ? "green" : "red"}>
                    {deadlineInfo.status}
                  </Text>
                </div>
                <div>
                  <Text size="sm" weight={500}>Deadline:</Text>
                  <Text size="sm">{deadlineInfo.enddate}</Text>
                </div>
                {isEligible && (
                  <Badge size="lg" color="green" variant="light">
                    {deadlineInfo.days_remaining} days left
                  </Badge>
                )}
              </Box>
            </Box>
          )}
        </>
      )}

      {renderForm()}
    </Container>
  );
}
