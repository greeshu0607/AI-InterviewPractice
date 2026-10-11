
import { useState } from "react";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Display a message with the correct color
  const showMessage = (text, type = "info") => {
    setMessage(text);
    setMessageType(type);
  };

  // Handle file selection
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    setQuestions([]);
    showMessage("");

    if (!selectedFile) {
      setFile(null);
      return;
    }

    // Allow only PDF and DOCX
    if (!/\.(pdf|docx)$/i.test(selectedFile.name)) {
      setFile(null);
      event.target.value = "";
      showMessage("Please select a PDF or DOCX file.", "error");
      return;
    }

    // Maximum file size: 5 MB
    if (selectedFile.size > 5 * 1024 * 1024) {
      setFile(null);
      event.target.value = "";
      showMessage("File size must be 5 MB or less.", "error");
      return;
    }

    setFile(selectedFile);
  };

  // Clean the AI response and keep only actual questions
  const extractQuestions = (response) => {
    let lines = [];

    if (Array.isArray(response)) {
      lines = response;
    } else if (typeof response === "string") {
      lines = response.split(/\r?\n/);
    } else {
      return [];
    }

    return lines
      .map((item) => {
        let line = String(item).trim();

        // Remove Markdown formatting
        line = line.replace(/\*\*/g, "");
        line = line.replace(/^#+\s*/, "");

        // Remove bullets and existing numbering
        line = line.replace(/^\s*[-*•]\s*/, "");
        line = line.replace(/^\s*\d+\s*[.)]\s*/, "");

        // Remove labels such as "Question 1:"
        line = line.replace(/^Question\s*\d*\s*:\s*/i, "");

        return line.trim();
      })
      // Exclude headings and keep actual questions only
      .filter((line) => line && line.includes("?"))
      .slice(0, 10);
  };

  // Upload the resume to the backend
  const handleUpload = async () => {
    if (!file) {
      showMessage("Please select your resume first.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setQuestions([]);

      showMessage(
        "Processing your resume and generating questions...",
        "info"
      );

      const response = await fetch(
        "http://127.0.0.1:8000/upload-resume",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || data.error || data.detail) {
        throw new Error(
          data.detail || data.error || "Unable to process your resume."
        );
      }

      const cleanedQuestions = extractQuestions(data.questions);

      if (cleanedQuestions.length === 0) {
        showMessage(
          "No interview questions were found. Please try again.",
          "error"
        );
        return;
      }

      setQuestions(cleanedQuestions);
      showMessage(
        "Your interview questions are ready!",
        "success"
      );
    } catch (error) {
      if (
        error.message === "Failed to fetch" ||
        error instanceof TypeError
      ) {
        showMessage(
          "Unable to connect. Please make sure the backend is running.",
          "error"
        );
      } else {
        showMessage(
          error.message || "Something went wrong. Please try again.",
          "error"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Remove the selected file
  const handleRemoveFile = () => {
    setFile(null);
    setQuestions([]);
    showMessage("");

    const input = document.getElementById("resume-file");

    if (input) {
      input.value = "";
    }
  };

  return (
    <div className="app">
      {/* Navigation bar */}
      <header className="navbar">
        <div className="brand">
          <span className="brand-name">
            Resume<span className="accent">IQ</span>
          </span>
        </div>

        <nav>
          <span className="nav-active">Home</span>
        </nav>
      </header>

      <main>
        {/* Main hero section */}
        <section className="hero" id="home">
          <div className="hero-content">
            <span className="eyebrow">
              AI-POWERED INTERVIEW PREPARATION
            </span>

            <h1>
              Turn Your Resume Into
              <br />
              <span className="gradient-text">
                Interview Success
              </span>
            </h1>

            <p className="description">
              Upload your resume and let AI generate personalized
              interview questions to help you practice, improve,
              and prepare for your next opportunity.
            </p>

            <ul className="benefits">
              <li>
                <span className="benefit-check">✓</span>
                Interview questions based on your resume
              </li>

              <li>
                <span className="benefit-check">✓</span>
                Practice your skills and project knowledge
              </li>

              <li>
                <span className="benefit-check">✓</span>
                Prepare confidently for interviews
              </li>
            </ul>
          </div>

          {/* Resume upload card */}
          <div className="upload-card">
            <div className="card-heading">
              <h2>Upload Your Resume</h2>
              <p>
                Select your resume to generate AI-powered
                interview questions.
              </p>
            </div>

            <label className="drop-zone" htmlFor="resume-file">
              {file ? (
                <>
                  <div className="file-symbol">
                    {file.name.toLowerCase().endsWith(".pdf")
                      ? "PDF"
                      : "DOCX"}
                  </div>

                  <strong className="filename">
                    {file.name}
                  </strong>

                  <span>
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </>
              ) : (
                <>
                  <strong>Choose your resume file</strong>
                  <span>PDF or DOCX from your computer</span>
                </>
              )}

              <span className="choose-file">
                {file ? "Choose Another File" : "Choose File"}
              </span>

              <span className="file-hint">
                Supports PDF and DOCX (Max 5MB)
              </span>
            </label>

            {/* Hidden native input prevents a duplicate Choose File button */}
            <input
              id="resume-file"
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              disabled={loading}
              className="hidden-file-input"
            />

            {file && (
              <button
                type="button"
                className="remove-file"
                onClick={handleRemoveFile}
                disabled={loading}
              >
                Remove selected file
              </button>
            )}

            <button
              type="button"
              className="generate-button"
              onClick={handleUpload}
              disabled={!file || loading}
            >
              {loading
                ? "Generating Questions..."
                : "Generate Interview Questions"}
            </button>

            {message && (
              <p
                className={`message ${messageType}`}
                role="status"
                aria-live="polite"
              >
                {message}
              </p>
            )}
          </div>
        </section>

        {/* Generated questions */}
        {questions.length > 0 && (
          <section className="results" id="results">
            <span className="eyebrow">
              YOUR PERSONALIZED RESULTS
            </span>

            <h2>Generated Interview Questions</h2>

            <div className="question-list">
              {questions.map((question, index) => (
                <div className="question-item" key={index}>
                  <span className="question-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <p>{question}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;