import { useState, useRef, useCallback } from "react";
import "./App.css";

const COUNTRIES = [
  "India", "Japan", "China", "USA", "Brazil", "Mexico", "France", "Germany",
  "Italy", "Spain", "Egypt", "Nigeria", "South Korea", "Thailand", "Indonesia",
  "Turkey", "Saudi Arabia", "Iran", "Argentina", "Colombia", "Vietnam",
  "Philippines", "Pakistan", "Bangladesh", "Russia", "Ukraine", "Poland",
  "Netherlands", "Sweden", "Norway", "Australia", "New Zealand", "Canada",
  "Morocco", "Ethiopia", "Kenya", "Ghana", "South Africa", "Peru", "Chile"
].sort();

export default function App() {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [sourceCountry, setSourceCountry] = useState("");
  const [targetCountry, setTargetCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const fileInputRef = useRef(null);

  const LOADING_STEPS = [
    "Analyzing cultural elements with GPT-4V...",
    "Mapping cultural equivalents...",
    "Generating transcreated image with DALL-E 3...",
    "Finalizing...",
  ];

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }
    setImage(file);
    setError(null);
    setResult(null);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, []);

  const handleSubmit = async () => {
    if (!image || !sourceCountry || !targetCountry) {
      setError("Please fill in all fields and upload an image.");
      return;
    }
    if (sourceCountry === targetCountry) {
      setError("Source and target countries must be different.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setLoadingStep(0);

    // Animate loading steps
    const stepInterval = setInterval(() => {
      setLoadingStep((s) => (s < LOADING_STEPS.length - 1 ? s + 1 : s));
    }, 4000);

    try {
      const formData = new FormData();
      formData.append("image", image);
      formData.append("sourceCountry", sourceCountry);
      formData.append("targetCountry", targetCountry);

      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const response = await fetch(`${API_URL}/api/transcreate`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Server error");
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-badge">AI-Powered</div>
        <h1>Cultural Transcreation</h1>
        <p className="subtitle">Transform images across cultures using GPT-4V + DALL-E 3</p>
      </header>

      <main className="main">
        <div className="card upload-card">
          <h2>Upload Image</h2>

          <div
            className={`dropzone ${dragOver ? "drag-over" : ""} ${imagePreview ? "has-image" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="preview-image" />
            ) : (
              <div className="dropzone-placeholder">
                <div className="upload-icon">🖼</div>
                <p>Drop image here or click to browse</p>
                <span>PNG, JPG, WEBP up to 10MB</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </div>

          {imagePreview && (
            <button className="change-btn" onClick={() => { setImage(null); setImagePreview(null); setResult(null); }}>
              ✕ Remove image
            </button>
          )}
        </div>

        <div className="card country-card">
          <h2>Cultural Direction</h2>
          <div className="selects">
            <div className="select-group">
              <label>Source Culture</label>
              <select value={sourceCountry} onChange={(e) => setSourceCountry(e.target.value)}>
                <option value="">Select country...</option>
                {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="arrow-icon">→</div>
            <div className="select-group">
              <label>Target Culture</label>
              <select value={targetCountry} onChange={(e) => setTargetCountry(e.target.value)}>
                <option value="">Select country...</option>
                {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {error && <div className="error-box">⚠ {error}</div>}

          <button
            className="transcreate-btn"
            onClick={handleSubmit}
            disabled={loading || !image || !sourceCountry || !targetCountry}
          >
            {loading ? "Transcreating..." : "✦ Transcreate Image"}
          </button>
        </div>

        {loading && (
          <div className="card loading-card">
            <div className="spinner" />
            <p className="loading-text">{LOADING_STEPS[loadingStep]}</p>
            <div className="loading-steps">
              {LOADING_STEPS.map((step, i) => (
                <div key={i} className={`step-dot ${i <= loadingStep ? "active" : ""}`} />
              ))}
            </div>
          </div>
        )}

        {result && (
          <div className="results">
            <div className="results-header">
              <h2>Transcreation Complete</h2>
              <span className="badge">{sourceCountry} → {targetCountry}</span>
            </div>

            <div className="comparison">
              <div className="comparison-item">
                <div className="comparison-label">Original ({sourceCountry})</div>
                <img src={imagePreview} alt="Original" className="comparison-img" />
              </div>
              <div className="comparison-divider">
                <div className="divider-line" />
                <span>✦</span>
                <div className="divider-line" />
              </div>
              <div className="comparison-item">
                <div className="comparison-label">Transcreated ({targetCountry})</div>
                <img src={result.generatedImageUrl} alt="Transcreated" className="comparison-img" />
                <a
                  href={result.generatedImageUrl}
                  download="transcreated.png"
                  target="_blank"
                  rel="noreferrer"
                  className="download-btn"
                >
                  ↓ Download
                </a>
              </div>
            </div>

            <div className="analysis-grid">
              <div className="analysis-card">
                <h3>📸 Image Analysis</h3>
                <p>{result.analysis}</p>
              </div>

              <div className="analysis-card mapping-card">
                <h3>🔄 Cultural Mapping</h3>
                <div className="mapping-list">
                  {result.culturalElements?.map((el, i) => (
                    <div key={i} className="mapping-row">
                      <span className="from-element">{el}</span>
                      <span className="mapping-arrow">→</span>
                      <span className="to-element">{result.transcreatedElements?.[i] || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
