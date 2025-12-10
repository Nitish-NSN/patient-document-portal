import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000";

// Convert file size into KB/MB
function formatSize(size) {
  if (size < 1024) return size + " B";
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
  return (size / (1024 * 1024)).toFixed(2) + " MB";
}

export default function App() {
  const [file, setFile] = useState(null);
  const [docs, setDocs] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch document list
  const loadDocuments = async () => {
    try {
      const res = await axios.get(`${API_BASE}/documents`);
      setDocs(res.data);
    } catch (err) {
      setMessage("Error loading documents");
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  // Validate files
  const handleFileChange = (event) => {
    setMessage("");
    const selectedFile = event.target.files[0];

    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      setMessage("Only PDF files are allowed.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setMessage("Max file size is 10MB.");
      return;
    }

    setFile(selectedFile);
  };

  // Upload file
  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a PDF file first.");
      return;
    }

    setLoading(true);
    setMessage("");

    try:
      const formData = new FormData();
      formData.append("file", file);

      await axios.post(`${API_BASE}/documents/upload`, formData, {
        headers: { "Con
