import os
import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PyPDF2 import PdfReader
import io

# Load environment variables
load_dotenv()

# Initialize FastAPI
app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Gemini API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is not set in the environment variables.")

# Configure the Gemini API
genai.configure(api_key=GEMINI_API_KEY)

# Global variable to store document text
document_text = ""

@app.post("/upload-document")
async def upload_document(file: UploadFile = File(...)):
    global document_text

    if file.content_type not in ["application/pdf", "text/plain"]:
        raise HTTPException(status_code=400, detail="Only PDF or TXT files are supported.")

    try:
        if file.content_type == "application/pdf":
            pdf_reader = PdfReader(io.BytesIO(await file.read()))
            document_text = "\n".join([page.extract_text() for page in pdf_reader.pages if page.extract_text()])
        else:  # For TXT files
            document_text = (await file.read()).decode("utf-8")

        if not document_text.strip():
            raise HTTPException(status_code=400, detail="No readable text found in document.")

        return {"message": "Document uploaded successfully!"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")


@app.post("/ask-question")
async def ask_question(question: str = Form(...)):
    if not document_text:
        raise HTTPException(status_code=400, detail="No document uploaded yet.")

    try:
        # Build the prompt using document context and question
        prompt = f"""
Document:
{document_text}

Question: {question}

Answer concisely and highlight key excerpts from the document by surrounding them with **double asterisks**.
"""

        # Initialize Gemini model (Ensure you're using the correct model name)
        model = genai.GenerativeModel("gemini-pro")

        # Get response from Gemini API
        response = model.generate_content(prompt)
        answer = response.text.strip()

        return JSONResponse({"answer": answer})

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating answer: {str(e)}")


# Run FastAPI using: python -m uvicorn main:app --reload
