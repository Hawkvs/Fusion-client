import React from "react";
import { Box, Text, Badge, Alert, Group, Card } from "@mantine/core";
import { Calendar, Clock, AlertCircle, CheckCircle } from "tabler-icons-react";

/**
 * DeadlineInfo Component - Displays scholarship deadline status
 * @param {object} deadlineInfo - Deadline information object from API
 * @param {boolean} isOpen - Whether application window is open
 * @param {number} daysRemaining - Number of days until deadline
 * @param {boolean} loading - Loading state
 * @param {string} variant - Display variant: 'alert', 'card', 'inline', 'compact'
 */
export function DeadlineInfo({
  deadlineInfo,
  isOpen,
  daysRemaining,
  loading,
  variant = "card",
}) {
  if (loading) {
    return <Text size="sm" color="dimmed">Checking deadline...</Text>;
  }

  if (!deadlineInfo) {
    return null;
  }

  const getStatusColor = () => {
    if (!isOpen) return "red";
    if (daysRemaining <= 1) return "orange";
    return "green";
  };

  const getStatusIcon = () => {
    if (!isOpen) return <AlertCircle size={16} />;
    if (daysRemaining <= 1) return <Clock size={16} />;
    return <CheckCircle size={16} />;
  };

  if (variant === "alert") {
    return (
      <Alert
        icon={getStatusIcon()}
        title={`Application ${isOpen ? "Open" : "Closed"}`}
        color={getStatusColor()}
        mt="lg"
        mb="lg"
      >
        {isOpen ? (
          <>
            <Text size="sm" mb="xs">
              Deadline: <strong>{deadlineInfo.enddate}</strong>
            </Text>
            {daysRemaining <= 1 && daysRemaining > 0 && (
              <Text size="sm" weight={500} color="orange">
                ⚠️ Only {daysRemaining} day remaining! Submit your application before the deadline.
              </Text>
            )}
            {daysRemaining > 1 && (
              <Text size="sm">
                {daysRemaining} days remaining for the application.
              </Text>
            )}
          </>
        ) : (
          <Text size="sm">
            {deadlineInfo.message || `Application window closed on ${deadlineInfo.enddate}`}
          </Text>
        )}
      </Alert>
    );
  }

  if (variant === "card") {
    return (
      <Card withBorder p="md" radius="md" mt="lg" mb="lg" bg={isOpen ? "#f0fdf4" : "#fef2f2"}>
        <Group position="apart">
          <div>
            <Text weight={500} size="sm" color="dimmed">
              APPLICATION STATUS
            </Text>
            <Group spacing="xs" mt="xs">
              <Badge
                size="lg"
                color={getStatusColor()}
                variant="light"
              >
                {isOpen ? "OPEN" : "CLOSED"}
              </Badge>
              {isOpen && daysRemaining <= 1 && (
                <Badge size="lg" color="orange" leftSection={<Clock size={12} />}>
                  {daysRemaining} day left
                </Badge>
              )}
            </Group>
          </div>
          <div>
            <Text weight={500} size="sm" color="dimmed">
              DEADLINE
            </Text>
            <Group spacing="xs" mt="xs">
              <Calendar size={14} />
              <Text weight={500}>{deadlineInfo.enddate}</Text>
            </Group>
          </div>
        </Group>
        {isOpen && (
          <Text size="sm" color="green" mt="md">
            ✓ You can submit your application now
          </Text>
        )}
        {!isOpen && (
          <Text size="sm" color="red" mt="md">
            ✗ The application window has closed. {deadlineInfo.message}
          </Text>
        )}
      </Card>
    );
  }

  if (variant === "compact") {
    return (
      <Box mt="sm" mb="sm">
        <Group spacing="sm">
          <Badge color={getStatusColor()} size="sm">
            {isOpen ? "Open" : "Closed"}
          </Badge>
          <Text size="sm" color="dimmed">
            Deadline: {deadlineInfo.enddate}
          </Text>
          {isOpen && daysRemaining <= 1 && (
            <Badge color="orange" size="sm" leftSection={<AlertCircle size={10} />}>
              {daysRemaining} day left
            </Badge>
          )}
        </Group>
      </Box>
    );
  }

  // Default inline variant
  return (
    <Text size="sm" color={isOpen ? "green" : "red"} weight={500}>
      {isOpen
        ? `✓ Application open until ${deadlineInfo.enddate} (${daysRemaining} days remaining)`
        : `✗ Application closed since ${deadlineInfo.enddate}`}
    </Text>
  );
}

/**
 * ActiveScholarshipsSelect Component - Select dropdown filtered to show only active scholarships
 * @param {array} scholarships - Array of active scholarships
 * @param {function} onChange - Callback when selection changes
 * @param {string} value - Currently selected value
 * @param {boolean} loading - Loading state
 */
export function ActiveScholarshipsSelect({
  scholarships,
  onChange,
  value,
  loading,
  placeholder = "Select an active scholarship",
}) {
  if (loading) {
    return <Text size="sm" color="dimmed">Loading active scholarships...</Text>;
  }

  if (!scholarships || scholarships.length === 0) {
    return (
      <Alert icon={<AlertCircle size={16} />} title="No Active Scholarships" color="yellow">
        No scholarships are currently open for applications. Please check back later.
      </Alert>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: "8px 12px",
        borderRadius: "4px",
        border: "1px solid #ccc",
        fontSize: "14px",
      }}
    >
      <option value="">{placeholder}</option>
      {scholarships.map((scholarship) => (
        <option key={scholarship.award_name} value={scholarship.award_name}>
          {scholarship.award_name} - Closes in {scholarship.days_remaining} days
        </option>
      ))}
    </select>
  );
}

export default DeadlineInfo;
