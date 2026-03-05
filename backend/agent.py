import os
import logging
import google.generativeai as genai
from dotenv import load_dotenv
from schemas import AgentResponse

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise RuntimeError("FATAL: GEMINI_API_KEY is not set in .env")

# Configure the SDK
genai.configure(api_key=api_key)

def parse_intent(message: str, context: str) -> AgentResponse:
    system_instruction = f"""
    You are an elite AI data extraction agent for a B2B MSME hardware business.
    Your sole job is to parse the user's natural language input and convert it into a strict JSON action.

    LIVE SHOP CONTEXT:
    {context}

    INSTRUCTIONS:
    1. Identify the action: "record_sale", "update_stock", "khata_payment", or "unknown".
    2. Exact Mapping: If the user mentions a product, use the LIVE SHOP CONTEXT to find the exact 'sku'. Do not guess SKUs.
    3. Extract quantities and monetary amounts mathematically.
    4. If the user mentions a payment from a company, find the exact 'customer_name' from the context.
    5. NULL HANDLING: If a field does not apply to the action (e.g., no SKU for a khata payment, or no amount for a stock update), you MUST return an empty string "" for text fields and 0 for number fields. Do not use null.
    6. 'confidence': Score from 0.0 to 1.0 based on how perfectly the user's request matches the context data.
    7. 'response_text': A professional, brief confirmation message to display to the user.
    8. IMPORTANT: The 'action' field MUST be one of: "record_sale", "update_stock", "khata_payment", or "unknown". No other values are allowed.
    """

    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction=system_instruction
    )

    # Wrap user message in delimiters to reduce prompt injection risk
    safe_message = f"<user_input>{message}</user_input>"

    try:
        response = model.generate_content(
            safe_message,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=AgentResponse,
                temperature=0.1 
            ),
            request_options={"timeout": 15}
        )
        
        return AgentResponse.model_validate_json(response.text)

    except Exception as e:
        logger.error(f"Gemini API Error: {e}")
        return AgentResponse(
            action="unknown",
            sku="",
            quantity=0,
            amount=0.0,
            customer_name="",
            confidence=0.0,
            response_text="I encountered a system error while processing that request. Could you please try again?"
        )