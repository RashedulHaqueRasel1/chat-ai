import os
import requests

# Automatically load environment variables from .env.local or .env if present
def load_env_file():
    for env_name in [".env.local", ".env"]:
        env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), env_name)
        if os.path.exists(env_path):
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k, v = k.strip(), v.strip().strip("'\"")
                            if k not in os.environ:
                                os.environ[k] = v
            except Exception:
                pass

load_env_file()

# =====================================================================
# Hugging Face Free Access Token
# টোকেনটি .env.local ফাইলে HF_TOKEN বা HUGGINGFACE_API_KEY হিসেবে রাখুন
# অথবা https://huggingface.co/settings/tokens থেকে নিন
# =====================================================================
HF_TOKEN = os.getenv("HF_TOKEN") or os.getenv("HUGGINGFACE_API_KEY") or os.getenv("NEXT_PUBLIC_HF_TOKEN", "")

# Hugging Face এর নতুন হাই-স্পিড সার্ভারলেস রাউটার এন্ডপয়েন্ট (OpenAI Compatible)
API_URL = "https://router.huggingface.co/v1/chat/completions"

headers = {
    "Authorization": f"Bearer {HF_TOKEN}",
    "Content-Type": "application/json"
}

def ask_qwen(prompt, system_message="You are a helpful, intelligent AI assistant."):
    """Qwen 2.5 72B মডেলকে প্রশ্ন করে উত্তর পাওয়ার ফাংশন"""
    if HF_TOKEN == "YOUR_HF_TOKEN_HERE" or not HF_TOKEN:
        print("\n[!] সতর্কবার্তা: দয়া করে স্ক্রিপ্টে আপনার HF_TOKEN বসান!")
        print("    টোকেন পেতে ভিজিট করুন: https://huggingface.co/settings/tokens\n")
        return None

    payload = {
        "model": "Qwen/Qwen2.5-72B-Instruct",
        "messages": [
            {"role": "system", "content": system_message},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 512,
        "temperature": 0.7
    }

    try:
        print(f"🤖 Qwen 2.5-কে প্রশ্ন পাঠানো হচ্ছে: '{prompt}'...")
        response = requests.post(API_URL, headers=headers, json=payload, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            reply = data["choices"][0]["message"]["content"]
            return reply
        else:
            return f"ত্রুটি (Status {response.status_code}): {response.text}"
    except Exception as e:
        return f"রিকোয়েস্টে সমস্যা হয়েছে: {str(e)}"

if __name__ == "__main__":
    print("=" * 60)
    print("      Qwen 2.5 AI Text Generator (Hugging Face Free API)      ")
    print("=" * 60)

    # টেস্ট প্রশ্ন
    test_prompt = "বাংলা ভাষায় ২ লাইনে কৃত্রিম বুদ্ধিমত্তা (AI) কী তা ব্যাখ্যা করো।"
    answer = ask_qwen(test_prompt)

    if answer:
        print("\n✅ AI এর টেস্ট উত্তর:")
        print("-" * 50)
        print(answer)
        print("-" * 50)

    print("\n💡 আপনি চাইলে এখন সরাসরি চ্যাট করতে পারেন (বন্ধ করতে 'exit' লিখুন):")
    while True:
        try:
            user_input = input("\nআপনি: ").strip()
            if not user_input:
                continue
            if user_input.lower() in ["exit", "quit", "q"]:
                print("চ্যাট সমাপ্ত। ধন্যবাদ!")
                break
            
            res = ask_qwen(user_input)
            print(f"\nQwen 2.5: {res}")
        except (KeyboardInterrupt, EOFError):
            print("\nচ্যাট বন্ধ করা হলো।")
            break
