import requests

BASE_URL = "http://127.0.0.1:5000"

def test_chat(session, session_name, wardrobe):
    print(f"\n--- Testing {session_name} ---")
    
    # Convert the wardrobe [(item_id, description)] to a string table
    wardrobe_str = "\n".join([f"{item_id}: {desc}" for item_id, desc in wardrobe])
    
    # Send first message
    response = session.post(f"{BASE_URL}/chat", json={"message": "Can you recommend me a gothic outfit?", "wardrobe": wardrobe_str})
    print(f"{session_name} Response 1:", response.json())
    
    response = session.post(f"{BASE_URL}/chat", json={"message": "Why did you give me a black shirt?", "wardrobe": wardrobe_str})
    print(f"{session_name} Response 2:", response.json())

    # Reset conversation for this session
    # response = session.post(f"{BASE_URL}/reset")
    # print(f"{session_name} Reset Response:", response.json())

def main():
    # Create two separate sessions
    session1 = requests.Session()
    
    # Test session 1
    test_chat(session1, "my_session", [
        ("1", "A red shirt"),
        ("2", "Blue jeans"),
        ("3", "Black shoes"),
        ("4", "A black hat"),
        ("5", "A white shirt"),
        ("6", "Black pants"),
        ("7", "Brown shoes"),
        ("8", "A brown hat"),
        ("9", "A black shirt"),
        ("10", "White pants")
    ])

if __name__ == "__main__":
    main()
