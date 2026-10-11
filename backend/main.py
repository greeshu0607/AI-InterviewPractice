from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import os

from dotenv import load_dotenv
from groq import Groq

from resume_parser import (
    extract_pdf_text,
    extract_docx_text
)


# Load .env file
load_dotenv()


# Create FastAPI app
app = FastAPI()


# Allow React frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Upload folder
UPLOAD_FOLDER = "uploads"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# Get Groq API key
api_key = os.getenv("GROQ_API_KEY")

client = Groq(api_key=api_key)


# Home API
@app.get("/")
def home():

    return {
        "message": "AI Resume Interviewer Backend is Running"
    }


# Resume Upload API
@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):

    # Create file path
    file_path = os.path.join(
        UPLOAD_FOLDER,
        file.filename
    )

    # Read file
    contents = await file.read()

    # Save file
    with open(file_path, "wb") as f:
        f.write(contents)


    # Extract text from PDF
    if file.filename.lower().endswith(".pdf"):

        resume_text = extract_pdf_text(file_path)


    # Extract text from DOCX
    elif file.filename.lower().endswith(".docx"):

        resume_text = extract_docx_text(file_path)


    else:

        return {
            "error": "Only PDF and DOCX files are supported"
        }


    # Send resume text to Groq
    prompt = f"""
You are an AI technical interviewer.

Analyze the following resume.

Generate 10 interview questions based ONLY on the information present in the resume.

Include questions about:
- Technical skills
- Projects
- Programming languages
- Technologies
- Databases
- Problem solving

Do not invent skills or experience that are not mentioned in the resume.

Resume:

{resume_text}
"""


    # Ask Groq
    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )


    # Get generated questions
    questions = response.choices[0].message.content


    # Return result
    return {
        "filename": file.filename,
        "resume_text": resume_text,
        "questions": questions
    }