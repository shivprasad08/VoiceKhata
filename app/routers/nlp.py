import os
import re
import json
import logging
from datetime import date
from typing import Optional
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, Field

# Using try-except so the app doesn't crash if langchain is not installed locally yet
try:
    from langchain_core.prompts import PromptTemplate
    from langchain_groq import ChatGroq
    from langchain_core.output_parsers import JsonOutputParser
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/parse-transaction", tags=["NLP Parser"])

class ParseRequest(BaseModel):
    text: str = Field(..., example="aaj subah manoj traders se 3000 ka maal liya")
    user_id: int = Field(..., example=123)

class ParseResponse(BaseModel):
    amount: float
    type: str
    vendor: Optional[str] = None
    category: str
    date: str
    gst_applicable: bool
    gst_amount: Optional[float] = None
    confidence: float
    raw_text: str
    parsed_by: str = "llm" # To distinguish between llm and regex fallback

# Initialize LLM Pipeline
def get_llm_chain():
    if not LANGCHAIN_AVAILABLE:
        return None
        
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or api_key.startswith("dummy_"):
        return None
        
    try:
        # Llama 3 8b is fast and excellent for JSON tasks
        llm = ChatGroq(temperature=0, model_name="llama3-8b-8192", groq_api_key=api_key)
        
        system_prompt = """You are a transaction parser for Indian small businesses. 
Parse the following Hindi/Hinglish/English text and extract transaction details.

Common patterns:
- 'X ka maal liya / kharida / aaya' = expense/purchase of X
- 'X becha / sale hua / mil gaye' = sale/income of X  
- 'X ka udhar diya / credit diya' = udhar/credit given to customer
- 'X ka payment aaya / received' = sale/income received

Return ONLY valid JSON with the exact following keys: 
- amount (number)
- type (must be exactly 'sale', 'expense', or 'udhar')
- vendor (string or null)
- category (string, default to 'General' if unsure)
- date (ISO string, assume today if not specified)
- gst_applicable (boolean)
- confidence (number between 0 and 1)

Do not include markdown blocks, just raw JSON.

User text: {text}
"""
        prompt = PromptTemplate(
            template=system_prompt,
            input_variables=["text"]
        )
        
        chain = prompt | llm | JsonOutputParser()
        return chain
    except Exception as e:
        logger.error(f"Failed to initialize LLM chain: {e}")
        return None

# Fallback Regex Parser
def fallback_regex_parse(text: str) -> dict:
    lower_text = text.lower()
    
    # Extract amount
    amount_match = re.search(r'(\d+(?:\.\d+)?)', lower_text)
    amount = float(amount_match.group(1)) if amount_match else 0.0
    
    # Infer type
    txn_type = "sale"
    if any(word in lower_text for word in ["maal liya", "kharida", "expense", "kharch", "diya"]):
        txn_type = "expense"
    elif any(word in lower_text for word in ["udhar", "baaki"]):
        txn_type = "udhar"
        
    # Infer GST
    gst_applicable = "gst" in lower_text or "bill" in lower_text
    
    return {
        "amount": amount,
        "type": txn_type,
        "vendor": "Unknown (Regex parsed)",
        "category": "General",
        "date": date.today().isoformat(),
        "gst_applicable": gst_applicable,
        "confidence": 0.5
    }

@router.post("", response_model=ParseResponse)
async def parse_transaction(request: Request, payload: ParseRequest):
    # This endpoint is rate limited via the main.py slowapi middleware wrapper
    
    logger.info(f"Parsing transaction request from user {payload.user_id}: {payload.text}")
    
    parsed_data = None
    parsed_by = "llm"
    
    # 1. Try LLM
    chain = get_llm_chain()
    if chain:
        try:
            parsed_data = chain.invoke({"text": payload.text})
            # Basic validation of LLM output
            if "amount" not in parsed_data or "type" not in parsed_data:
                raise ValueError("LLM returned incomplete JSON")
                
            # If date is not provided, use today
            if not parsed_data.get("date"):
                parsed_data["date"] = date.today().isoformat()
                
        except Exception as e:
            logger.warning(f"LLM parsing failed: {e}. Falling back to Regex.")
            parsed_data = None
            
    # 2. Fallback to Regex if LLM failed or not configured
    if not parsed_data:
        parsed_by = "regex"
        parsed_data = fallback_regex_parse(payload.text)
        
    # 3. Compute GST if applicable (assuming 18% inclusive for demo)
    gst_amount = None
    if parsed_data.get("gst_applicable"):
        # Formula for inclusive GST 18%: GST = Total - (Total / 1.18)
        gst = parsed_data["amount"] - (parsed_data["amount"] / 1.18)
        gst_amount = round(gst, 2)
        
    response = ParseResponse(
        amount=parsed_data["amount"],
        type=parsed_data["type"],
        vendor=parsed_data.get("vendor"),
        category=parsed_data.get("category", "General"),
        date=parsed_data.get("date", date.today().isoformat()),
        gst_applicable=parsed_data.get("gst_applicable", False),
        gst_amount=gst_amount,
        confidence=parsed_data.get("confidence", 0.5),
        raw_text=payload.text,
        parsed_by=parsed_by
    )
    
    logger.info(f"Parsed result: {response.model_dump_json()}")
    return response
