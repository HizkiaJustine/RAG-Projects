import os
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from rag_service import ingest_urls, ingest_pdf, query_chatbot

app = FastAPI(title="RAG Chatbot API")

# Setup CORS untuk mengizinkan request dari frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Ganti dengan URL frontend saat produksi (misal: http://localhost:3000)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Folder penyimpanan sementara untuk PDF
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class URLRequest(BaseModel):
    urls: List[str]

class QueryRequest(BaseModel):
    question: str

@app.post("/ingest-url")
async def process_urls(request: URLRequest):
    if not request.urls:
        raise HTTPException(status_code=400, detail="No URLs provided")
        
    print(f"Processing {len(request.urls)} URLs...")
    chunks_added = ingest_urls(request.urls)
    
    if chunks_added == 0:
        raise HTTPException(status_code=500, detail="Failed to process URLs")
        
    return {"message": f"Successfully processed URLs and added {chunks_added} chunks to the database"}

@app.post("/ingest-pdf")
async def process_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    # Simpan file secara lokal
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    print(f"Processing PDF: {file.filename}...")
    chunks_added = ingest_pdf(file_path)
    
    # Hapus file setelah diproses untuk menghemat ruang
    os.remove(file_path)
    
    if chunks_added == 0:
        raise HTTPException(status_code=500, detail="Failed to process PDF")
        
    return {"message": f"Successfully processed {file.filename} and added {chunks_added} chunks to the database"}

@app.post("/query")
async def ask_question(request: QueryRequest):
    if not request.question:
        raise HTTPException(status_code=400, detail="Question cannot be empty")
        
    print(f"Received query: {request.question}")
    result = query_chatbot(request.question)
    
    if result["status"] == "error":
        raise HTTPException(status_code=500, detail=result["answer"])
        
    return result