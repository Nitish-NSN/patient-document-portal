# Design Document – Patient Document Portal

This document explains the architecture, technology choices, API design, user flow, and validation rules for the **Patient Document Portal** assignment.

---

## 1. 🎯 Project Overview
The Patient Document Portal is a simple full-stack application that allows users to:

- Upload PDF medical documents  
- View the list of uploaded documents  
- Download documents  
- Delete documents  
- Validate file type & size before upload  

The goal is to build a functional, well-structured, and clean application suitable for an entry-level full-stack assignment.

---

## 2. 🏗 Architecture Overview

### **Client (React)**
- File selection and validation  
- Uploads PDF via `multipart/form-data`  
- Displays uploaded documents in a table  
- Provides download and delete actions  

### **Server (Node.js + Express)**
- Receives uploaded PDFs  
- Validates file type & size  
- Stores files in `backend/uploads/`  
- Saves metadata (filename, size, upload timestamp) in SQLite  
- Serves download & delete operations  

### **Database (SQLite)**  
Stores document metadata:

| Column       | Type    | Description                |
|--------------|---------|----------------------------|
| id           | INTEGER | Primary key                |
| filename     | TEXT    | Saved filename             |
| filepath     | TEXT    | File storage path          |
| filesize     | INTEGER | File size in bytes         |
| uploaded_at  | TEXT    | Timestamp                  |

---

## 3. 🔧 Technology Choices

### **Frontend**
- React (Hooks + functional components)
- Axios for API requests

**Why React?**  
- Simple to build UI  
- Easy state handling (hooks)  
- Very common in industry

---

### **Backend**
- Node.js + Express  
- Multer (file uploads)  
- CORS  
- SQLite3  

**Why Node.js?**  
- Lightweight and fast  
- Perfect for file upload handling  
- Easy JSON API creation  

**Why SQLite?**  
- Zero configuration  
- Great for local/file-based projects  
- Does not require server installation  

---

## 4. 🧠 System Flow

### 1️⃣ User selects PDF  
→ Frontend validates type & size  
→ Shows error message if invalid  

### 2️⃣ User uploads  
→ React posts `FormData` to `/documents/upload`  
→ Backend stores file + saves metadata in DB  

### 3️⃣ Document list loads  
→ React fetches `/documents`  
→ Displays table of documents  

### 4️⃣ Download  
→ User clicks download link  
→ Backend streams file using `/documents/:id`  

### 5️⃣ Delete file  
→ React sends `DELETE /documents/:id`  
→ Backend removes file + DB entry  

---

## 5. 🛡 Validation Rules

### **Frontend**
- Accept only `.pdf`  
- Max file size: **10MB**  
- Shows error messages  

### **Backend**
- Multer fileFilter: allow only `application/pdf`  
- Multer size limit: 10MB  
- Returns proper JSON errors  

---

## 6. 🔗 API Endpoints

### **POST /documents/upload**
Uploads a new PDF.

**Request:**  
`multipart/form-data` with field name `"file"`

**Response:**  
```json
{
  "message": "Uploaded",
  "id": 1,
  "filename": "123-report.pdf",
  "size": 204800,
  "uploaded_at": "2025-01-01T10:00:00Z"
}
