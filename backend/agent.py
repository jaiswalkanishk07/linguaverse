import os
import logging
from groq import Groq
from dotenv import load_dotenv
from schemas import AgentResponse

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv(override=True)  # force reload .env values
api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise RuntimeError("FATAL: GROQ_API_KEY is not set in .env")

# Configure the SDK
client = Groq(api_key=api_key)

def parse_intent(message: str, context: str) -> AgentResponse:
    system_instruction = f"""
    You are an elite AI data extraction agent for a B2B MSME hardware business.
    Your sole job is to parse the user's natural language input and convert it into a strict JSON action.

    LIVE SHOP CONTEXT:
    {context}

    INSTRUCTIONS:
    1. Identify the action from this list:
       - "update_stock"  — user wants to add/receive stock (e.g., "50 soap aaya", "relay ka stock badhao")
       - "add_product"   — user wants to ADD A NEW PRODUCT that doesn't exist yet (e.g., "naya item add karo", "Fevikwik add karo inventory mein")
       - "record_sale"   — user sold items to a customer (e.g., "10 colgate becha 450 mein")
       - "khata_payment" — customer payment received (e.g., "TechNova ne 5000 diya")
       - "get_stock"     — user wants to CHECK current stock levels (e.g., "soap kitna bacha", "relay ka stock batao")
       - "get_khata"     — user wants to CHECK customer balance (e.g., "Raju ka kitna baaki hai")
       - "get_report"    — user wants sales/revenue report (e.g., "aaj ka report dikhao", "monthly revenue")
       - "clarify"       — request is ambiguous, need more info (e.g., "kuch karo", "help")
       - "unknown"       — completely unrelated or cannot determine intent
    2. Exact Mapping: If the user mentions a product, use the LIVE SHOP CONTEXT to find the exact 'sku'. Do not guess SKUs.
       For "add_product": Use 'sku' for the product name, 'quantity' for initial stock, 'amount' for unit price. If the user doesn't specify SKU, generate one from the product name (e.g., "Fevikwik" → "CHM-FVK-001").
    3. Extract quantities and monetary amounts mathematically.
    4. If the user mentions a payment from a company, find the exact 'customer_name' from the context.
    5. NULL HANDLING: If a field does not apply to the action (e.g., no SKU for a khata payment, or no amount for a stock update), you MUST return an empty string "" for text fields and 0 for number fields. Do not use null.
    6. 'confidence': Score from 0.0 to 1.0 based on how perfectly the user's request matches the context data.
    7. 'response_text': A professional, brief confirmation message to display to the user.
    8. IMPORTANT: The 'action' field MUST be one of: "update_stock", "add_product", "record_sale", "khata_payment", "get_stock", "get_khata", "get_report", "clarify", or "unknown". No other values are allowed.
    9. MULTILINGUAL NUMBERS: Convert Hindi/Hinglish numbers to digits:
       ek=1, do=2, teen=3, char=4, panch=5, chhah=6, saat=7, aath=8, nau=9
       dus=10, bees=20, tees=30, chaalees=40, pachaas=50, saath=60, sattar=70, assi=80, nabbe=90
       sau=100, hazaar=1000, lakh=100000
       If words like "thoda" or "bahut" are used without a specific number, return action: "unknown" and ask for exact quantity.
    10. LANGUAGE DETECTION & MATCHING (CRITICAL):
        - You MUST detect the language the user is speaking.
        - Add a field "detected_language" to your JSON output. It MUST be one of: "hi", "en", or "ta".
        - If the user speaks in HINDI (Devanagari) or HINGLISH (Hindi words in Roman script, e.g. "soap kitna bacha", "aaj ka report dikhao"), set detected_language="hi" and write response_text in HINDI DEVANAGARI script (e.g. "स्टॉक अपडेट हो गया", "आपकी रिपोर्ट तैयार है"). ALWAYS use Devanagari for Hindi/Hinglish.
        - HINGLISH KEYWORDS: kitna, dikhao, batao, bacha, aaya, becha, diya, karo, hai, mein, ka, ki, ke, nahi, kya, aaj, kal, bohot, thoda, badhao
        - If the user speaks in ENGLISH (e.g. "show me stock", "get report"), set detected_language="en" and write response_text in pure ENGLISH.
        - If the user speaks in TAMIL SCRIPT (e.g. "சரக்கு காட்டு") OR TANGLISH (Tamil words in Roman script), set detected_language="ta" and write response_text in TAMIL script (தமிழ்).
        - TANGLISH KEYWORDS: enna, epdi, evlo, sollu, podu, pannunga, irukku, venum, kudunga, paaru, paar, edhu, yaaruku, romba, konjam, stocku, illa, oru, inniki, nalla, kaasu, kadai, saamaan, kodukku, vaangu, vilai, tholla, mattum
        - DISTINGUISHING TANGLISH vs HINGLISH: If you see Tamil-origin words (above list), classify as Tamil (ta). If you see Hindi-origin words, classify as Hindi (hi). When in doubt, look at sentence structure — Tanglish often ends words with "u" (stocku, pannunga) and uses SOV word order.
        - The response_text MUST ALWAYS be in the native script of the detected language. Never mix scripts.
    11. CONFIDENCE SCORING:
        - Exact SKU match + exact quantity + clear action = 0.95
        - Product name match (not exact SKU) + quantity = 0.80
        - Partial/ambiguous match = 0.50-0.60
        - Cannot determine intent = 0.10-0.30
    12. If the user asks in Hindi/Hinglish about stock report, like "stock ki report generate karein", then the response should be in Hindi Devanagari script. Both in text and audio.
    """

    model_name = "llama-3.3-70b-versatile"

    # Wrap user message in delimiters to reduce prompt injection risk
    safe_message = f"<user_input>{message}</user_input>"
    sys_prompt = system_instruction + "\nCRITICAL: Output ONLY valid JSON."

    import time
    max_retries = 2
    for attempt in range(max_retries + 1):
        try:
            response = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": sys_prompt},
                    {"role": "user", "content": safe_message}
                ],
                model=model_name,
                response_format={"type": "json_object"},
                temperature=0.1,
                timeout=30
            )
            
            content = response.choices[0].message.content
            if not content:
                raise ValueError("Empty response from Groq")
            
            return AgentResponse.model_validate_json(content)

        except Exception as e:
            logger.error(f"Groq API Error (attempt {attempt+1}/{max_retries+1}): {type(e).__name__}: {e}")
            if attempt < max_retries:
                time.sleep(2)  # Groq rate limit backoff
                continue
            return AgentResponse(
                action="unknown",
                sku="",
                quantity=0,
                amount=0.0,
                customer_name="",
                confidence=0.0,
                response_text="सिस्टम व्यस्त है। कृपया थोड़ा इंतज़ार करें और फिर कोशिश करें।",
                detected_language="hi"
            )