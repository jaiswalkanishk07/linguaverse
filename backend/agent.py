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
    1. Identify the action from this list:
       - "update_stock"  — user wants to add/receive stock (e.g., "50 soap aaya", "relay ka stock badhao")
       - "record_sale"   — user sold items to a customer (e.g., "10 colgate becha 450 mein")
       - "khata_payment" — customer payment received (e.g., "TechNova ne 5000 diya")
       - "get_stock"     — user wants to CHECK current stock levels (e.g., "soap kitna bacha", "relay ka stock batao")
       - "get_khata"     — user wants to CHECK customer balance (e.g., "Raju ka kitna baaki hai")
       - "get_report"    — user wants sales/revenue report (e.g., "aaj ka report dikhao", "monthly revenue")
       - "clarify"       — request is ambiguous, need more info (e.g., "kuch karo", "help")
       - "unknown"       — completely unrelated or cannot determine intent
    2. Exact Mapping: If the user mentions a product, use the LIVE SHOP CONTEXT to find the exact 'sku'. Do not guess SKUs.
    3. Extract quantities and monetary amounts mathematically.
    4. If the user mentions a payment from a company, find the exact 'customer_name' from the context.
    5. NULL HANDLING: If a field does not apply to the action (e.g., no SKU for a khata payment, or no amount for a stock update), you MUST return an empty string "" for text fields and 0 for number fields. Do not use null.
    6. 'confidence': Score from 0.0 to 1.0 based on how perfectly the user's request matches the context data.
    7. 'response_text': A professional, brief confirmation message to display to the user.
    8. IMPORTANT: The 'action' field MUST be one of: "update_stock", "record_sale", "khata_payment", "get_stock", "get_khata", "get_report", "clarify", or "unknown". No other values are allowed.
    9. MULTILINGUAL NUMBERS: Convert Hindi/Hinglish numbers to digits:
       ek=1, do=2, teen=3, char=4, panch=5, chhah=6, saat=7, aath=8, nau=9
       dus=10, bees=20, tees=30, chaalees=40, pachaas=50, saath=60, sattar=70, assi=80, nabbe=90
       sau=100, hazaar=1000, lakh=100000
       If words like "thoda" or "bahut" are used without a specific number, return action: "unknown" and ask for exact quantity.
    10. LANGUAGE MATCHING: Your 'response_text' MUST be in the same language the merchant used. If they spoke Hindi, reply in Hindi. If Tamil, reply in Tamil-English mix. If English, reply in English. If Hinglish, reply in Hinglish.
    11. CONFIDENCE SCORING:
        - Exact SKU match + exact quantity + clear action = 0.95
        - Product name match (not exact SKU) + quantity = 0.80
        - Partial/ambiguous match = 0.50-0.60
        - Cannot determine intent = 0.10-0.30
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