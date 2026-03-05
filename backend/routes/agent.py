import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas import AgentRequest, AgentResponse
from rag import build_context 
from agent import parse_intent 

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/parse", response_model=AgentResponse)
def parse_user_message(payload: AgentRequest, db: Session = Depends(get_db)):
    """
    Takes a natural language message from the frontend, pulls live DB context, 
    and asks Gemini to parse it into a strict JSON action.
    """
    try:
        # 1. Grab the live inventory and Khata data so Gemini isn't blind
        context = build_context(payload.shop_id, db)
        
        # 2. Pass the user's message and the live context to the Gemini model
        ai_response = parse_intent(message=payload.message, context=context)
        
        return ai_response
        
    except Exception as e:
        logger.error(f"AI Agent Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse message with AI Agent")