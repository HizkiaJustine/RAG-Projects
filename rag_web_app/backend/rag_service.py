import os
from typing import Dict, List
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_ollama import ChatOllama, OllamaEmbeddings
from langchain_community.document_loaders import SeleniumURLLoader, PyPDFLoader
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv

load_dotenv()

MODEL_NAME = os.getenv("MODEL_NAME", "llama3.2:1b")
CHROMA_DIR = "./chroma_db"

embeddings = OllamaEmbeddings(model="nomic-embed-text")

# Inisialisasi Vector Store Persistent
db = Chroma(persist_directory=CHROMA_DIR, embedding_function=embeddings)

def split_and_add_to_db(raw_docs: List) -> int:
    if not raw_docs:
        return 0
        
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    all_texts, all_metadatas = [], []
    
    for document in raw_docs:
        text = document.page_content
        source = document.metadata.get("source", "Unknown")

        chunks = text_splitter.split_text(text)
        for chunk in chunks:
            all_texts.append(chunk)
            all_metadatas.append({"source": source})

    # Tambahkan chunk baru ke instance database yang sudah ada
    db.add_texts(texts=all_texts, metadatas=all_metadatas)
    print(f"Successfully added {len(all_texts)} chunk to Vector Store.")
    return len(all_texts)


def ingest_urls(urls: List[str]) -> int:
    try:
        loader = SeleniumURLLoader(urls=urls)
        raw_docs = loader.load()
        return split_and_add_to_db(raw_docs)
    except Exception as e:
        print(f"Error scraping URL: {str(e)}")
        return 0


def ingest_pdf(file_path: str) -> int:
    try:
        loader = PyPDFLoader(file_path)
        raw_docs = loader.load()
        return split_and_add_to_db(raw_docs)
    except Exception as e:
        print(f"Error reading PDF: {str(e)}")
        return 0


def setup_qa_chain():
    if MODEL_NAME == "gemini-3.5-flash":
        llm = ChatGoogleGenerativeAI(model=MODEL_NAME)
    else:
        llm = ChatOllama(model=MODEL_NAME, base_url="http://localhost:11434")
        
    retriever = db.as_retriever(search_kwargs={"k": 4})

    prompt = ChatPromptTemplate.from_template(
        """
        Please provide a polite and helpful response to the following question, utilizing the provided context. 
        Ensure that the tone remains professional, courteous, and empathetic, and tailor your response to directly address the inquiry. 

        ### Context:
        {context}

        ### Question: 
        {question}

        """
    )

    chain = (
        {"context": retriever, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )
    return chain, retriever


def query_chatbot(query: str) -> Dict:
    try:
        chain, retriever = setup_qa_chain()
        response = chain.invoke(query)
        docs = retriever.invoke(query)
        
        # Menggunakan set untuk menghindari duplikasi nama sumber yang sama
        sources = list(set([doc.metadata.get("source", "") for doc in docs if doc.metadata.get("source")]))
        
        return {
            "status": "success",
            "answer": response,
            "sources": sources
        }
    except Exception as e:
        print(f"Error when processing query: {str(e)}")
        return {
            "status": "error",
            "answer": "Sorry, error occurred when processing your question.",
            "sources": []
        }