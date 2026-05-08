/* eslint-disable react/prop-types */
import React, { useState } from "react";
import { fetchFrontendCatalog } from "../../services/api";
import {
  TextInput,
  Select,
  NumberInput,
  Button,
  Paper,
  Stack,
  Grid,
  FileInput,
  Textarea,
  Group,
  Title,
  Checkbox,
} from "@mantine/core";
import {
  submitMcmApplication,
  submitSingleParentApplication,
} from "../../services/api";

function ScholarshipForm({ onClose }) {
  const [formData, setFormData] = useState({
    scholarship_type: "Merit Cum Means (MCM)",
    student_name: "",
    roll_no: "",
    email: "",
    batch: "",
    programme: "",
    category: "",
    mobile_number: "",
    address: "",
    pincode: "",
    father_name: "",
    mother_name: "",
    parent_name: "",
    guardian_name: "",
    annual_income: "",
    parent_status: "Both Parents Alive",
    jee_rank: "",
      cpi: "",
    declaration_checked: false,
  });

  const [files, setFiles] = useState({});

  const [errors, setErrors] = useState({});

  const [activeScholarships, setActiveScholarships] = React.useState(["Merit Cum Means (MCM)", "Single Parent"]);
  const [catalogLoaded, setCatalogLoaded] = React.useState(false);

  React.useEffect(() => {
    fetchFrontendCatalog().then(data => {
      if (Array.isArray(data)) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const active = [];
        data.forEach(item => {
          let isOpen = true;
          if (item.deadline) {
            const dl = new Date(item.deadline);
            dl.setHours(23, 59, 59, 999);
            if (today > dl) isOpen = false;
          }
          if (isOpen) {
            if (item.name.toLowerCase().includes("merit") || item.name.toLowerCase().includes("mcm")) {
              active.push("Merit Cum Means (MCM)");
            } else if (item.name.toLowerCase().includes("single")) {
              active.push("Single Parent");
            } else {
              active.push(item.name);
            }
          }
        });
        
        setActiveScholarships(active);
        if (active.length > 0) {
          setFormData(prev => ({...prev, scholarship_type: active[0]}));
        } else {
          setFormData(prev => ({...prev, scholarship_type: ""}));
        }
      }
      setCatalogLoaded(true);
    }).catch(err => {
      console.error("Failed to load catalog", err);
      setCatalogLoaded(true);
    });
  }, []);


  const validateField = (name, value) => {
    let errorMsg = null;
    
    if (name === 'cpi' && value && (parseFloat(value) < 8.0 || parseFloat(value) > 10.0)) {
      errorMsg = 'CPI must be between 8.0 and 10.0';
    } else if (name === 'annual_income' && value && (Number.isNaN(Number(value)) || Number(value) < 0 || Number(value) > 500000)) {
      errorMsg = 'Annual income must be between 0 and 5,00,000';
    } else if (name === 'mobile_number' && value && !/^\d{10}$/.test(value)) {
      errorMsg = 'Mobile number must be exactly 10 digits';
    } else if (name === 'pincode' && value && !/^\d{6}$/.test(value)) {
      errorMsg = 'Pincode must be exactly 6 digits';
    } else if (name === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errorMsg = 'Invalid email format';
    }

    setErrors(prev => ({ ...prev, [name]: errorMsg }));
    return errorMsg;
  };

  const handleBlur = (name) => {
    validateField(name, formData[name]);
  };

  const handleInputChange = (name, value) => {
    if (name === 'cpi') {
      const val = parseFloat(value);
      if (val > 10 || val < 0) return;
    }
    if (name === 'annual_income') {
      const val = parseInt(value, 10);
      if (val > 500000) {
        alert("Income cannot exceed ₹5,00,000 for this scholarship.");
        return;
      }
    }
    setFormData({ ...formData, [name]: value });
    validateField(name, value);
  };

  const handleFileChange = (name, file) => {
    if (file && file.size > 200 * 1024) {
      alert(`The file ${file.name} exceeds the 200 KB size limit.`);
      return;
    }
    setFiles({ ...files, [name]: file });
  };

  const validateForm = () => {
    const requiredFields = [
      "email",
      "student_name",
      "roll_no",
      "batch",
      "programme",
      "category",
      "mobile_number",
      "address",
      "pincode",
      "annual_income",
        "cpi",
      ];

    if (formData.parent_status === "Both Parents Alive") {
      requiredFields.push("father_name", "mother_name");
    } else if (formData.parent_status === "Single Parent") {
      requiredFields.push("parent_name");
    } else if (formData.parent_status === "Orphan / No Parents Alive") {
      requiredFields.push("guardian_name");
    }

    const isMissingField = requiredFields.some((field) => {
      if (!formData[field]) {
        alert(`Please fill in the required field: ${field}`);
        return true;
      }
      return false;
    });

    if (isMissingField) return false;

    // Enhanced Validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert(`Please enter a valid email address.`);
      return false;
    }

    if (!/^\d{10}$/.test(formData.mobile_number)) {
      alert(`Mobile number must be exactly 10 digits.`);
      return false;
    }

    if (!/^\d{6}$/.test(formData.pincode)) {
      alert(`Pincode must be exactly 6 digits.`);
      return false;
    }

    if (
      Number.isNaN(Number(formData.annual_income)) ||
      Number(formData.annual_income) < 0
    ) {
      alert(`Annual income must be a valid positive number.`);
      return false;
    }

    if (formData.batch === "2025" && !formData.jee_rank) {
      alert(
        `Please fill in your JEE Main / UCEED Rank if you are a 2025 batch student`,
      );
      return false;
    }

    if (!formData.declaration_checked) {
      alert(`Please check the declaration checkbox to proceed`);
      return false;
    }

    const requiredFiles = ["undertaking_form", "application_form", "last_sem_result"];

    if (formData.parent_status === "Both Parents Alive") {
      requiredFiles.push("income_certificate", "mother_income_certificate");
    } else if (formData.parent_status === "Single Parent") {
      requiredFiles.push("income_certificate", "death_certificate");
} else if (formData.parent_status === "Orphan / No Parents Alive") {
      requiredFiles.push("income_certificate", "death_certificate");
    }

    if (formData.category && formData.category !== "GEN") {
      requiredFiles.push("caste_certificate");
    }

    if (formData.jee_rank) {
      requiredFiles.push("score_card");
    }

    const isMissingFile = requiredFiles.some((file) => {
      if (!files[file]) {
        alert(`Please upload the required document: ${file}`);
        return true;
      }
      return false;
    });

    if (isMissingFile) return false;

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const cpiValue = parseFloat(formData.cpi);
    const incomeValue = parseInt(formData.annual_income);
    
    if (cpiValue < 1 || cpiValue > 10) {
      alert("CPI must lie between 1 and 10.");
      return;
    }

    if (cpiValue < 8.0 || incomeValue > 500000) {
      alert("Eligibility Criteria not fulfilled: CPI must be >= 8.0 and Annual Family Income must be <= 500,000. Application cannot be submitted.");
      return;
    }

    if (!validateForm()) return;

    try {
      const submissionData = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key !== "address" && key !== "pincode" && key !== "guardian_name") {
          submissionData.append(key, formData[key]);
        }
      });

      submissionData.append(
        "address",
        `${formData.address} - Pin: ${formData.pincode}`,
      );

      if (formData.parent_status === "Orphan / No Parents Alive") {
        submissionData.append("father_name", formData.guardian_name);
      } else if (formData.parent_status === "Single Parent") {
        submissionData.append("father_name", formData.parent_name);
      }

      submissionData.append("status", "SUBMITTED");

      Object.keys(files).forEach((key) => {
        if (files[key]) {
          submissionData.append(key, files[key]);
        }
      });

      if (formData.scholarship_type === "Merit Cum Means (MCM)") {
        console.log("Submitting MCM Data:", [...submissionData.entries()]);
        await submitMcmApplication(submissionData);
      } else {
        console.log("Submitting Single Parent Data:", [...submissionData.entries()]);
        await submitSingleParentApplication(submissionData);
      }
      alert("Application Submitted Successfully!");
      if (onClose) onClose();
    } catch (error) {
      console.error(error);
      if (error.response && error.response.data) {
        const errMsg = error.response.data.error || JSON.stringify(error.response.data, null, 2);
        alert('Server Validation Error:\\n' + errMsg);
      } else {
        alert('Error submitting application. Please try again.');
      }
    }
  };

  return (
    <Paper withBorder shadow="none" p="md" radius="md">
      <Stack spacing="md">
        <form onSubmit={handleSubmit}>
          <Grid>
            <Grid.Col span={12}>
                            <Select
                  label="Scholarship Type"
                  required
                  error={errors.scholarship_type}
                  onBlur={() => handleBlur('scholarship_type')}
                  value={formData.scholarship_type}
                  onChange={(value) =>
                    handleInputChange("scholarship_type", value)
                  }
                  data={activeScholarships}
                  disabled={activeScholarships.length === 0}
                  placeholder={activeScholarships.length === 0 ? "No Active Scholarships" : "Select"}
                />
            </Grid.Col>
            <Grid.Col span={12}>
              <Title order={4}>Student Details</Title>
            </Grid.Col>
            <Grid.Col span={12} sm={6}>
              <TextInput
                label="Email (Student email)"
                required
          error={errors.email}
          onBlur={() => handleBlur('email')}
          value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </Grid.Col>
            <Grid.Col span={12} sm={6}>
              <TextInput
                label="Student Full Name"
                required
          error={errors.student_name}
          onBlur={() => handleBlur('student_name')}
          value={formData.student_name}
                onChange={(e) =>
                  handleInputChange("student_name", e.target.value)
                }
              />
            </Grid.Col>
            <Grid.Col span={12} sm={6}>
              <TextInput
                label="Roll No."
                required
          error={errors.roll_no}
          onBlur={() => handleBlur('roll_no')}
          value={formData.roll_no}
                onChange={(e) => handleInputChange("roll_no", e.target.value)}
              />
            </Grid.Col>
            <Grid.Col span={12} sm={6}>
              <Select
                label="Batch"
                required
                data={["2022", "2023", "2024", "2025"]}
          error={errors.batch}
          onBlur={() => handleBlur('batch')}
          value={formData.batch}
                onChange={(val) => handleInputChange("batch", val)}
              />
            </Grid.Col>
            <Grid.Col span={12} sm={6}>
                <TextInput
                  label="CPI / Score"
                  required
                  type="number"
                  min="1"
                  max="10"
                  step="0.01"
                  error={errors.cpi}
                  onBlur={() => handleBlur('cpi')}
                  value={formData.cpi || ''}
                  onChange={(e) => handleInputChange('cpi', e.currentTarget.value)}
                />
              </Grid.Col>
              <Grid.Col span={12} sm={6}>
                <FileInput
                  label="Last Semester Result Document (PDF)"
                  required
                  accept="application/pdf"
                  onChange={(file) => handleFileChange('last_sem_result', file)}
                />
              </Grid.Col>
              <Grid.Col span={12} sm={6}>                <Select
                  label="Programme"
                required
                data={[
                  "B.Tech (CSE)",
                  "B.Tech (ECE)",
                  "B.Tech (ME)",
                  "B.Tech (SM)",
                  "B.Des.",
                ]}
          error={errors.programme}
          onBlur={() => handleBlur('programme')}
          value={formData.programme}
                onChange={(val) => handleInputChange("programme", val)}
              />
            </Grid.Col>
            <Grid.Col span={12} sm={6}>
              <TextInput
                label="Mobile No. (Only Student)"
                required
                maxLength={10}
          error={errors.mobile_number}
          onBlur={() => handleBlur('mobile_number')}
          value={formData.mobile_number}
                onChange={(e) =>
                  handleInputChange(
                    "mobile_number",
                    e.target.value.replace(/\D/g, "").slice(0, 10),
                  )
                }
              />
            </Grid.Col>
            <Grid.Col span={12} sm={8}>
              <Textarea
                label="Complete Postal address"
                required
          error={errors.address}
          onBlur={() => handleBlur('address')}
          value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
              />
            </Grid.Col>
            <Grid.Col span={12} sm={4}>
              <TextInput
                label="Pin code"
                required
                maxLength={6}
          error={errors.pincode}
          onBlur={() => handleBlur('pincode')}
          value={formData.pincode}
                onChange={(e) =>
                  handleInputChange(
                    "pincode",
                    e.target.value.replace(/\D/g, "").slice(0, 6),
                  )
                }
              />
            </Grid.Col>

            <Grid.Col span={12}>
              {" "}
              <Title order={4} mt="md">
                Personal Details
              </Title>
            </Grid.Col>
            <Grid.Col span={12} sm={6}>
              <Select
                label="Category"
                required
                data={["GEN", "GEN-EWS", "OBC", "SC", "ST"]}
          error={errors.category}
          onBlur={() => handleBlur('category')}
          value={formData.category}
                onChange={(val) => handleInputChange("category", val)}
              />
            </Grid.Col>
            {formData.batch === "2025" && (
              <Grid.Col span={12} sm={6}>
                <TextInput
                  label="JEE Main Score / UCEED Score (ALL INDIA RANKING only)"
                  required
          error={errors.jee_rank}
          onBlur={() => handleBlur('jee_rank')}
          value={formData.jee_rank}
                  onChange={(e) =>
                    handleInputChange("jee_rank", e.target.value)
                  }
                />
              </Grid.Col>
            )}

            <Grid.Col span={12}>
              <Title order={4} mt="md">
                Family Details
              </Title>
            </Grid.Col>
            <Grid.Col span={12} sm={6}>
              <Select
                label="Parent Status"
                required
                data={[
                  "Both Parents Alive",
                  "Single Parent",
                  "Orphan / No Parents Alive",
                ]}
          error={errors.parent_status}
          onBlur={() => handleBlur('parent_status')}
          value={formData.parent_status}
                onChange={(val) => handleInputChange("parent_status", val)}
              />
            </Grid.Col>
            {formData.parent_status === "Both Parents Alive" && (
              <Grid.Col span={12} sm={6}>
                <TextInput
                  label="Father Name"
                  required
          error={errors.father_name}
          onBlur={() => handleBlur('father_name')}
          value={formData.father_name}
                  onChange={(e) =>
                    handleInputChange("father_name", e.target.value)
                  }
                />
              </Grid.Col>
            )}
            {formData.parent_status === "Both Parents Alive" && (
              <Grid.Col span={12} sm={6}>
                <TextInput
                  label="Mother Name"
                  required
          error={errors.mother_name}
          onBlur={() => handleBlur('mother_name')}
          value={formData.mother_name}
                  onChange={(e) =>
                    handleInputChange("mother_name", e.target.value)
                  }
                />
              </Grid.Col>
            )}
            {formData.parent_status === "Single Parent" && (
              <Grid.Col span={12} sm={6}>
                <TextInput
                  label="Parent Name"
                  required
          error={errors.parent_name}
          onBlur={() => handleBlur('parent_name')}
          value={formData.parent_name}
                  onChange={(e) =>
                    handleInputChange("parent_name", e.target.value)
                  }
                />
              </Grid.Col>
            )}
            {formData.parent_status === "Orphan / No Parents Alive" && (
              <Grid.Col span={12} sm={6}>
                <TextInput
                  label="Guardian Name"
                  required
          error={errors.guardian_name}
          onBlur={() => handleBlur('guardian_name')}
          value={formData.guardian_name}
                  onChange={(e) =>
                    handleInputChange("guardian_name", e.target.value)
                  }
                />
              </Grid.Col>
            )}
            <Grid.Col span={12} sm={6}>
              <NumberInput
                label="Annual income (From all sources mention on income certificate)"
                required
          error={errors.annual_income}
          onBlur={() => handleBlur('annual_income')}
          value={formData.annual_income}
                onChange={(val) => handleInputChange("annual_income", val)}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <Title order={4} mt="md">
                Mandatory Documents
              </Title>
            </Grid.Col>
            {[
              "Both Parents Alive",
              "Single Parent",
              "Orphan / No Parents Alive",
            ].includes(formData.parent_status) && (
              <Grid.Col span={12} sm={6}>
                <FileInput
                  label={
                    formData.parent_status === "Orphan / No Parents Alive"
                      ? "Guardian Income Certificate"
                      : formData.parent_status === "Single Parent"
                      ? "Parent Income Certificate"
                      : "Father Income Certificate"
                  }
                  required
                  onChange={(file) =>
                    handleFileChange("income_certificate", file)
                  }
                />
              </Grid.Col>
            )}
            {formData.parent_status === "Both Parents Alive" && (
              <Grid.Col span={12} sm={6}>
                <FileInput
                  label="Mother Income Certificate (If applicable, or note if nil)"
                  required
                  onChange={(file) =>
                    handleFileChange("mother_income_certificate", file)
                  }
                />
              </Grid.Col>
            )}
            {formData.batch === "2025" && (
              <Grid.Col span={12} sm={6}>
                <FileInput
                  label="JEE Score Card / UCEED Score Card"
                  required
                  onChange={(file) => handleFileChange("score_card", file)}
                />
              </Grid.Col>
            )}
            <Grid.Col span={12} sm={6}>
              <FileInput
                label="Questionnaire cum application form (Form A/B/D)"
                required
                onChange={(file) => handleFileChange("application_form", file)}
              />
            </Grid.Col>
            <Grid.Col span={12} sm={6}>
              <FileInput
                label="Undertaking form"
                required
                onChange={(file) => handleFileChange("undertaking_form", file)}
              />
            </Grid.Col>

            {[
              "Single Parent",
              "Orphan / No Parents Alive",
            ].includes(formData.parent_status) && (
              <Grid.Col span={12} sm={6}>
                <FileInput
                  label="Death Certificate(s)"
                  required
                  onChange={(file) =>
                    handleFileChange("death_certificate", file)
                  }
                />
              </Grid.Col>
            )}

            {formData.category && formData.category !== "GEN" && (
              <Grid.Col span={12} sm={6}>
                <FileInput
                  label="Caste Certificate"
                  required
                  onChange={(file) =>
                    handleFileChange("caste_certificate", file)
                  }
                />
              </Grid.Col>
            )}

            <Grid.Col span={12}>
              <Checkbox
                label="I hereby declare all the information/documents provided are correct and true to the best of my knowledge."
                checked={formData.declaration_checked}
                onChange={(e) =>
                  handleInputChange(
                    "declaration_checked",
                    e.currentTarget.checked,
                  )
                }
                mt="md"
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <Group
                position="right"
                mt="md"
                style={{ justifyContent: "flex-end", gap: "10px" }}
              >
                <Button variant="outline" color="red" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" color="blue" disabled={activeScholarships.length === 0}>
                  {activeScholarships.length === 0 ? "No Active Scholarships" : "Submit"}
                </Button>
              </Group>
            </Grid.Col>
          </Grid>
        </form>
      </Stack>
    </Paper>
  );
}

export default ScholarshipForm;
