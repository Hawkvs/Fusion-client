import { useState, useEffect } from "react";

/**
 * Custom hook to fetch and manage scholarship deadline information
 * @param {string} awardName - Name of the scholarship/award
 * @param {string} apiBaseUrl - Base URL for the API (default: http://localhost:8000/spacs)
 * @returns {object} - { deadlineInfo, isOpen, daysRemaining, loading, error }
 */
export const useScholarshipDeadline = (
  awardName,
  apiBaseUrl = "http://localhost:8000/spacs"
) => {
  const [deadlineInfo, setDeadlineInfo] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!awardName) {
      setLoading(false);
      return;
    }

    const fetchDeadlineInfo = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("authToken");
        const response = await fetch(`${apiBaseUrl}/scholarship-deadline/`, {
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
          setIsOpen(data.is_open);
          setDaysRemaining(data.days_remaining);
          setError(null);
        } else {
          setDeadlineInfo(data);
          setIsOpen(false);
          setDaysRemaining(0);
          setError(data.error || "Unable to fetch deadline information");
        }
      } catch (err) {
        console.error("Error fetching deadline info:", err);
        setError("Error fetching deadline information");
        setIsOpen(false);
        setDeadlineInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDeadlineInfo();
  }, [awardName, apiBaseUrl]);

  return { deadlineInfo, isOpen, daysRemaining, loading, error };
};

/**
 * Custom hook to fetch active scholarships
 * @param {string} apiBaseUrl - Base URL for the API (default: http://localhost:8000/spacs)
 * @returns {object} - { scholarships, loading, error }
 */
export const useActiveScholarships = (
  apiBaseUrl = "http://localhost:8000/spacs"
) => {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActiveScholarships = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("authToken");
        const response = await fetch(`${apiBaseUrl}/active-scholarships/`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });

        const data = await response.json();
        
        if (data.result === "Success") {
          setScholarships(data.scholarships || []);
          setError(null);
        } else {
          setScholarships([]);
          setError(data.message || "No active scholarships available");
        }
      } catch (err) {
        console.error("Error fetching active scholarships:", err);
        setError("Error fetching scholarship information");
        setScholarships([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveScholarships();
  }, [apiBaseUrl]);

  return { scholarships, loading, error };
};

/**
 * Format deadline status for display
 * @param {object} deadlineInfo - Deadline information object
 * @returns {object} - { status, color, message }
 */
export const getDeadlineStatus = (deadlineInfo) => {
  if (!deadlineInfo) {
    return {
      status: "Unknown",
      color: "gray",
      message: "Unable to determine deadline status",
    };
  }

  if (deadlineInfo.is_open) {
    if (deadlineInfo.days_remaining <= 1) {
      return {
        status: "Closing Soon",
        color: "orange",
        message: `Only ${deadlineInfo.days_remaining} day(s) remaining!`,
      };
    }
    return {
      status: "Open",
      color: "green",
      message: `${deadlineInfo.days_remaining} days remaining to apply`,
    };
  } else {
    return {
      status: "Closed",
      color: "red",
      message: `Application closed on ${deadlineInfo.enddate}`,
    };
  }
};

/**
 * Check if a scholarship's deadline has passed
 * @param {string} awardName - Name of the scholarship/award
 * @returns {boolean} - true if deadline has passed
 */
export const hasDeadlinePassed = (awardName, apiBaseUrl = "http://localhost:8000/spacs") => {
  const { isOpen, loading } = useScholarshipDeadline(awardName, apiBaseUrl);
  return !isOpen && !loading;
};
