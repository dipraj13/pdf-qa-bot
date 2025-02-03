// src/App.js
import React, { useState } from 'react';
import './App.css';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);

  // Handle document file selection
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  // Upload document to the backend
  const handleUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      const res = await fetch("http://localhost:8000/upload-document", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setUploadMessage("Document uploaded successfully.");
      } else {
        setUploadMessage("Upload failed: " + data.detail);
      }
    } catch (err) {
      console.error(err);
      setUploadMessage("Upload error.");
    }
  };

  // Ask a question and add the interaction to the chat history
  const handleAsk = async () => {
    if (!question) return;
    // Add the user's question to the chat history
    setChatHistory((prev) => [...prev, { type: "question", text: question }]);
    try {
      const formData = new FormData();
      formData.append("question", question);
      const res = await fetch("http://localhost:8000/ask-question", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setChatHistory((prev) => [...prev, { type: "answer", text: data.answer }]);
      } else {
        setChatHistory((prev) => [...prev, { type: "answer", text: "Error: " + data.detail }]);
      }
    } catch (err) {
      console.error(err);
      setChatHistory((prev) => [...prev, { type: "answer", text: "Error occurred." }]);
    }
    setQuestion("");
  };

  return (
    <div className="App">
      <h1>Document Q&A Bot</h1>
      <div className="upload-section">
        <h2>Upload Document (PDF/TXT, max 10MB)</h2>
        <input type="file" accept=".pdf,text/plain" onChange={handleFileChange} />
        <button onClick={handleUpload}>Upload Document</button>
        <p>{uploadMessage}</p>
      </div>
      <div className="chat-section">
        <h2>Ask a Question</h2>
        <div className="chat-history">
          {chatHistory.map((item, idx) => (
            <div key={idx} className={`chat-item ${item.type}`}>
              {/* If answer contains **, it will show as plain text; advanced implementations can parse markdown */}
              {item.text.split("\n").map((line, i) => (
                <p key={i} dangerouslySetInnerHTML={{ __html: line }}></p>
              ))}
            </div>
          ))}
        </div>
        <input
          type="text"
          placeholder="Enter your question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button onClick={handleAsk}>Send Question</button>
      </div>
    </div>
  );
}

export default App;
